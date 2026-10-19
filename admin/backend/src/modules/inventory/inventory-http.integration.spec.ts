import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

// Explicit opt-in: real HTTP/auth/validation against MySQL. Every write belongs
// to unique fixtures; existing users, permissions, grants and stock stay intact.
const databaseTest =
  process.env.RUN_INVENTORY_DB_TESTS === '1' ? describe : describe.skip;

interface ErrorEnvelope {
  success: false;
  error: { code: string; details?: string[] };
}

databaseTest('inventory HTTP permissions and validation (real MySQL)', () => {
  const fixtureId = `inventory-http-${randomUUID()}`;
  const userId = `${fixtureId}-user`;
  const roleId = `${fixtureId}-role`;
  const productId = `${fixtureId}-product`;
  const email = `${fixtureId}@example.test`;
  const password = `Aa1!${randomUUID()}`;
  let app: INestApplication | undefined;
  let prisma: PrismaService;
  let origin: string;
  let token: string;
  const permissionIds = new Map<string, string>();

  const request = (path: string, method = 'GET', body?: unknown) =>
    fetch(`${origin}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  const grant = async (name: string) => {
    const permissionId = permissionIds.get(name);
    if (!permissionId) throw new Error(`Missing fixture permission ${name}`);
    await prisma.rolePermission.create({ data: { roleId, permissionId } });
  };

  beforeAll(async () => {
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
    await prisma.$connect();
    for (const name of [
      'inventory:read',
      'inventory:adjust',
      'product:delete',
    ]) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { name },
      });
      permissionIds.set(name, permission.id);
    }
    await prisma.role.create({
      data: { id: roleId, name: roleId, isSystem: false },
    });
    await grant('inventory:read');
    await prisma.user.create({
      data: {
        id: userId,
        email,
        password: await bcrypt.hash(password, 10),
        firstName: 'Inventory',
        lastName: 'HTTP test',
        roles: { create: { roleId } },
      },
    });
    await prisma.product.create({
      data: {
        id: productId,
        slug: productId,
        sku: fixtureId,
        nameAr: 'منتج اختبار معزول',
        nameFr: 'Produit de test isolé',
        price: 10,
        inventory: { create: {} },
      },
    });
    await app.listen(0, '127.0.0.1');
    origin = `${await app.getUrl()}/api/v1`;
    const response = await fetch(`${origin}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(response.status).toBe(200);
    const login = (await response.json()) as {
      success: true;
      data: { accessToken: string };
    };
    expect(login.success).toBe(true);
    expect(login.data.accessToken).toEqual(expect.any(String));
    token = login.data.accessToken;
  }, 30_000);

  beforeEach(async () => {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await grant('inventory:read');
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.stockMovement.deleteMany({ where: { productId } });
        await prisma.inventoryItem.deleteMany({ where: { productId } });
        await prisma.product.deleteMany({ where: { id: productId } });
        await prisma.auditLog.deleteMany({ where: { userId } });
        await prisma.refreshToken.deleteMany({ where: { userId } });
        await prisma.user.deleteMany({ where: { id: userId } });
        await prisma.role.deleteMany({ where: { id: roleId } });
      }
    } finally {
      await app?.close();
    }
  });

  it('requires authentication for inventory reads', async () => {
    const response = await fetch(`${origin}/inventory?limit=1`);
    expect(response.status).toBe(401);
    expect((await response.json()) as ErrorEnvelope).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('permits balance/history reads while denying adjustment and threshold writes', async () => {
    const response = await request(
      `/inventory?search=${encodeURIComponent(fixtureId)}&page=1&limit=1`,
    );
    expect(response.status).toBe(200);
    const result = (await response.json()) as {
      success: true;
      data: {
        items: { productId: string; quantity: number }[];
        meta: { total: number };
      };
    };
    expect(result.success).toBe(true);
    expect(result.data.items).toMatchObject([{ productId, quantity: 0 }]);
    expect(result.data.meta.total).toBe(1);
    expect((await request(`/inventory/${productId}/movements`)).status).toBe(
      200,
    );
    for (const [path, method, body] of [
      [
        `/inventory/${productId}/adjustments`,
        'POST',
        { delta: 1, reason: 'Physical count' },
      ],
      [
        `/inventory/${productId}/threshold`,
        'PATCH',
        { lowStockThreshold: 2, reason: 'Reorder policy' },
      ],
    ] as const) {
      const denied = await request(path, method, body);
      expect(denied.status).toBe(403);
      expect((await denied.json()) as ErrorEnvelope).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN_PERMISSION' },
      });
    }
  });

  it('revokes balance and movement access on the next request with the same JWT', async () => {
    expect((await request('/inventory?limit=1')).status).toBe(200);
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    for (const path of [
      '/inventory?limit=1',
      `/inventory/${productId}/movements`,
    ]) {
      const denied = await request(path);
      expect(denied.status).toBe(403);
      expect((await denied.json()) as ErrorEnvelope).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN_PERMISSION' },
      });
    }
  });

  it.each([
    ['adjustments', 'POST', { delta: 0, reason: 'Physical count' }],
    ['adjustments', 'POST', { delta: 1.5, reason: 'Physical count' }],
    ['adjustments', 'POST', { delta: 1, reason: '   ' }],
    ['adjustments', 'POST', { delta: 1, reason: null }],
    [
      'adjustments',
      'POST',
      { delta: 1, reason: 'Physical count', lowStockThreshold: null },
    ],
    [
      'adjustments',
      'POST',
      { delta: 1, reason: 'Physical count', quantity: 99 },
    ],
    ['threshold', 'PATCH', { lowStockThreshold: 2, reason: '   ' }],
    ['threshold', 'PATCH', { lowStockThreshold: null, reason: 'Policy' }],
  ])(
    'rejects invalid %s input %s %j without mutation',
    async (path, method, input) => {
      await grant('inventory:adjust');
      const invalid = await request(
        `/inventory/${productId}/${path}`,
        method,
        input,
      );
      expect(invalid.status).toBe(400);
      expect((await invalid.json()) as ErrorEnvelope).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
      expect(
        await prisma.inventoryItem.findUniqueOrThrow({ where: { productId } }),
      ).toMatchObject({ quantity: 0, lowStockThreshold: 0 });
      expect(await prisma.stockMovement.count({ where: { productId } })).toBe(
        0,
      );
      expect(
        await prisma.auditLog.count({ where: { entityId: productId } }),
      ).toBe(0);
    },
  );

  it('audits an authorized adjustment and refuses to delete its stock history', async () => {
    await grant('inventory:adjust');
    await grant('product:delete');
    const adjusted = await request(
      `/inventory/${productId}/adjustments`,
      'POST',
      {
        delta: 3,
        reason: '  Physical count  ',
      },
    );
    expect(adjusted.status).toBe(201);
    expect(
      await prisma.stockMovement.findFirstOrThrow({ where: { productId } }),
    ).toMatchObject({
      actorId: userId,
      delta: 3,
      balanceAfter: 3,
      reason: 'Physical count',
      kind: 'ADJUSTMENT',
    });
    expect(
      await prisma.auditLog.findFirstOrThrow({
        where: { entityId: productId, action: 'inventory.adjusted' },
      }),
    ).toMatchObject({ userId });
    const deletion = await request(`/products/${productId}`, 'DELETE');
    expect(deletion.status).toBe(400);
    expect((await deletion.json()) as ErrorEnvelope).toMatchObject({
      success: false,
      error: { code: 'FOREIGN_KEY_CONSTRAINT' },
    });
    expect(await prisma.product.count({ where: { id: productId } })).toBe(1);
    expect(
      await prisma.inventoryItem.findUniqueOrThrow({ where: { productId } }),
    ).toMatchObject({ quantity: 3 });
    expect(await prisma.stockMovement.count({ where: { productId } })).toBe(1);
  });
});
