import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from './products.service';

const databaseTest =
  process.env.RUN_INVENTORY_DB_TESTS === '1' ? describe : describe.skip;

databaseTest('product opening stock (real MySQL HTTP)', () => {
  const prefix = `opening-${randomUUID()}`;
  const userId = `${prefix}-user`;
  const roleId = `${prefix}-role`;
  let app: INestApplication;
  let prisma: PrismaService;
  let origin: string;
  let token: string;
  let sequence = 0;
  const permissionIds = new Map<string, string>();

  const grant = async (name: string) => {
    const permissionId = permissionIds.get(name);
    if (!permissionId) throw new Error(`Missing permission ${name}`);
    await prisma.rolePermission.create({ data: { roleId, permissionId } });
  };
  const request = (body: unknown, path = '/products', method = 'POST') =>
    fetch(`${origin}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  const payload = () => ({
    nameAr: 'كرسي اختبار',
    nameFr: 'Chaise test',
    price: 10,
    sku: `${prefix}-${sequence++}`,
  });

  const previousThrottleLimit = process.env.THROTTLE_LIMIT;
  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = '1000';
    const { AppModule } = await import('../../app.module');
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    prisma = app.get(PrismaService);
    for (const name of [
      'product:create',
      'product:update',
      'inventory:adjust',
    ]) {
      permissionIds.set(
        name,
        (await prisma.permission.findUniqueOrThrow({ where: { name } })).id,
      );
    }
    await prisma.role.create({ data: { id: roleId, name: roleId } });
    const email = `${prefix}@example.test`;
    const password = `Aa1!${randomUUID()}`;
    await prisma.user.create({
      data: {
        id: userId,
        email,
        password: await bcrypt.hash(password, 10),
        firstName: 'Opening',
        lastName: 'Test',
        roles: { create: { roleId } },
      },
    });
    await app.listen(0, '127.0.0.1');
    origin = `${await app.getUrl()}/api/v1`;
    const login = await fetch(`${origin}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(login.status).toBe(200);
    token = ((await login.json()) as { data: { accessToken: string } }).data
      .accessToken;
  }, 30000);

  beforeEach(async () => {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await grant('product:create');
  });

  afterAll(async () => {
    try {
      if (prisma) {
        const ids = (
          await prisma.product.findMany({
            where: { sku: { startsWith: prefix } },
            select: { id: true },
          })
        ).map((product) => product.id);
        await prisma.stockMovement.deleteMany({
          where: { productId: { in: ids } },
        });
        await prisma.inventoryItem.deleteMany({
          where: { productId: { in: ids } },
        });
        await prisma.product.deleteMany({ where: { id: { in: ids } } });
        await prisma.auditLog.deleteMany({ where: { userId } });
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.role.deleteMany({ where: { id: roleId } });
      }
    } finally {
      if (previousThrottleLimit === undefined)
        delete process.env.THROTTLE_LIMIT;
      else process.env.THROTTLE_LIMIT = previousThrottleLimit;
      await app?.close();
    }
  });

  it.each([{ initialQuantity: 2 }, { lowStockThreshold: 2 }])(
    'requires inventory adjustment permission for %j without creating a product',
    async (stock) => {
      const body = { ...payload(), ...stock, stockReason: 'Opening count' };
      const denied = await request(body);
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN_PERMISSION' },
      });
      expect(await prisma.product.count({ where: { sku: body.sku } })).toBe(0);
    },
  );

  it.each([{}, { initialQuantity: 0, lowStockThreshold: 0 }])(
    'allows catalog-only creation with %j and records one atomic create audit',
    async (stock) => {
      const response = await request({ ...payload(), ...stock });
      expect(response.status).toBe(201);
      const { data } = (await response.json()) as { data: { id: string } };
      expect(
        await prisma.inventoryItem.findUniqueOrThrow({
          where: { productId: data.id },
        }),
      ).toMatchObject({ quantity: 0, lowStockThreshold: 0 });
      expect(
        await prisma.auditLog.count({
          where: { entityId: data.id, action: 'product.created' },
        }),
      ).toBe(1);
      expect(
        await prisma.stockMovement.count({ where: { productId: data.id } }),
      ).toBe(0);
    },
  );

  it('creates stock, a snapshot movement, and both audits atomically; permission revocation applies with the same JWT', async () => {
    await grant('inventory:adjust');
    const body = {
      ...payload(),
      initialQuantity: 8,
      oldPrice: null,
      categoryId: null,
      lowStockThreshold: 3,
      stockReason: '  Opening count  ',
    };
    const response = await request(body);
    expect(response.status).toBe(201);
    const { data } = (await response.json()) as { data: { id: string } };
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({
        where: { productId: data.id },
      }),
    ).toMatchObject({ quantity: 8, lowStockThreshold: 3 });
    expect(
      await prisma.stockMovement.findMany({ where: { productId: data.id } }),
    ).toMatchObject([
      {
        kind: 'ADJUSTMENT',
        delta: 8,
        balanceAfter: 8,
        reason: 'Opening count',
        actorId: userId,
        productNameAr: body.nameAr,
        productNameFr: body.nameFr,
        productSku: body.sku,
      },
    ]);
    const logs = await prisma.auditLog.findMany({
      where: { entityId: data.id },
      orderBy: { action: 'asc' },
    });
    expect(logs.map((entry) => entry.action)).toEqual([
      'inventory.adjusted',
      'product.created',
    ]);
    expect(logs.every((entry) => entry.userId === userId)).toBe(true);
    await prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: permissionIds.get('inventory:adjust')! },
    });
    const deniedBody = {
      ...payload(),
      initialQuantity: 1,
      stockReason: 'Count',
    };
    expect((await request(deniedBody)).status).toBe(403);
    expect(await prisma.product.count({ where: { sku: deniedBody.sku } })).toBe(
      0,
    );
  });

  it('sets a threshold without inventing a zero stock movement', async () => {
    await grant('inventory:adjust');
    const response = await request({
      ...payload(),
      lowStockThreshold: 3,
      stockReason: 'Reorder policy',
    });
    expect(response.status).toBe(201);
    const { data } = (await response.json()) as { data: { id: string } };
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({
        where: { productId: data.id },
      }),
    ).toMatchObject({ quantity: 0, lowStockThreshold: 3 });
    expect(
      await prisma.stockMovement.count({ where: { productId: data.id } }),
    ).toBe(0);
    expect(
      await prisma.auditLog.count({
        where: { entityId: data.id, action: 'inventory.threshold_changed' },
      }),
    ).toBe(1);
  });

  it.each([
    { initialQuantity: -1 },
    { initialQuantity: 1.5 },
    { initialQuantity: null },
    { lowStockThreshold: -1 },
    { lowStockThreshold: 1.5 },
    { lowStockThreshold: null },
    { initialQuantity: 1 },
    { initialQuantity: 1, stockReason: '  ' },
    { initialQuantity: 1, stockReason: null },
  ])('rejects invalid stock %j before creating anything', async (stock) => {
    await grant('inventory:adjust');
    const body = { ...payload(), ...stock };
    const response = await request(body);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
    expect(await prisma.product.count({ where: { sku: body.sku } })).toBe(0);
  });

  it('rejects all creation-only stock fields on PATCH without changing inventory', async () => {
    await grant('product:update');
    const response = await request(payload());
    const { data } = (await response.json()) as { data: { id: string } };
    for (const field of [
      { initialQuantity: 5 },
      { lowStockThreshold: 5 },
      { stockReason: 'Count' },
    ]) {
      expect(
        (await request(field, `/products/${data.id}`, 'PATCH')).status,
      ).toBe(400);
    }
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({
        where: { productId: data.id },
      }),
    ).toMatchObject({ quantity: 0, lowStockThreshold: 0 });
  });

  it('rolls back product and inventory when an opening movement cannot be recorded', async () => {
    const body = { ...payload(), initialQuantity: 2, stockReason: 'Count' };
    const service = app.get(ProductsService);
    await expect(
      service.create(body, `${prefix}-missing-user`),
    ).rejects.toThrow();
    expect(await prisma.product.count({ where: { sku: body.sku } })).toBe(0);
    expect(
      await prisma.stockMovement.count({ where: { productSku: body.sku } }),
    ).toBe(0);
  });
});
