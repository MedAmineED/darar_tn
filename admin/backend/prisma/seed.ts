import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Canonical permission catalog: resource -> allowed actions. */
const RESOURCE_ACTIONS: Record<string, string[]> = {
  user: ['create', 'read', 'update', 'delete'],
  role: ['create', 'read', 'update', 'delete'],
  product: ['create', 'read', 'update', 'delete'],
  category: ['create', 'read', 'update', 'delete'],
  order: ['create', 'read', 'update', 'delete'],
  customer: ['create', 'read', 'update', 'delete'],
  setting: ['read', 'update'],
  dashboard: ['read'],
  audit: ['read'],
  inventory: ['read', 'adjust'],
  pack: ['create', 'read', 'update', 'delete'],
  accounting: ['read', 'manage'],
  traffic: ['read'],
};

/** Permission names granted to each non-super role. */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'category:create',
    'category:read',
    'category:update',
    'category:delete',
    'order:create',
    'order:read',
    'order:update',
    'order:delete',
    'customer:create',
    'customer:read',
    'customer:update',
    'customer:delete',
    'setting:read',
    'setting:update',
    'dashboard:read',
    'audit:read',
    'inventory:read',
    'inventory:adjust',
    'pack:create',
    'pack:read',
    'pack:update',
    'pack:delete',
    'traffic:read',
  ],
  MANAGER: [
    'product:read',
    'pack:read',
    'traffic:read',
    'inventory:read',
    'category:read',
    'order:read',
    'order:update',
    'customer:read',
    'dashboard:read',
  ],
};

async function seedPermissions(): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();
  for (const [resource, actions] of Object.entries(RESOURCE_ACTIONS)) {
    for (const action of actions) {
      const name = `${resource}:${action}`;
      const permission = await prisma.permission.upsert({
        where: { name },
        update: { resource, action },
        create: {
          name,
          resource,
          action,
          description: `Can ${action} ${resource}`,
        },
      });
      idByName.set(name, permission.id);
    }
  }
  console.log(`  ✓ ${idByName.size} permissions`);
  return idByName;
}

async function seedRoles(
  permissionIds: Map<string, string>,
): Promise<Map<string, string>> {
  const roleIdByName = new Map<string, string>();

  const definitions: { name: string; description: string }[] = [
    { name: 'SUPER_ADMIN', description: 'Full, unrestricted system access' },
    { name: 'ADMIN', description: 'Manage catalog, orders and customers' },
    { name: 'MANAGER', description: 'Limited operational access' },
  ];

  for (const def of definitions) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      update: { description: def.description, isSystem: true },
      create: { name: def.name, description: def.description, isSystem: true },
    });
    roleIdByName.set(def.name, role.id);

    const permissionNames =
      def.name === 'SUPER_ADMIN'
        ? [...permissionIds.keys()]
        : (ROLE_PERMISSIONS[def.name] ?? []);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: permissionNames
        .map((name) => permissionIds.get(name))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log(`  ✓ ${roleIdByName.size} roles`);
  return roleIdByName;
}

async function seedSuperAdmin(superAdminRoleId: string): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@darihome.tn';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Super';
  const lastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Admin';

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, isActive: true },
    create: {
      email,
      firstName,
      lastName,
      password: passwordHash,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: user.id, roleId: superAdminRoleId },
  });

  console.log(`  ✓ SUPER_ADMIN user: ${email}`);
}

async function seedCategories(): Promise<void> {
  const categories = [
    { nameAr: 'أثاث', nameFr: 'Mobilier', slug: 'mobilier', sortOrder: 1 },
    { nameAr: 'ديكور', nameFr: 'Décoration', slug: 'decoration', sortOrder: 2 },
    { nameAr: 'إضاءة', nameFr: 'Luminaires', slug: 'luminaires', sortOrder: 3 },
    { nameAr: 'مطبخ', nameFr: 'Cuisine', slug: 'cuisine', sortOrder: 4 },
  ];
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { nameAr: category.nameAr, nameFr: category.nameFr },
      create: category,
    });
  }
  console.log(`  ✓ ${categories.length} example categories`);
}

async function seedProducts(): Promise<void> {
  const categories = await prisma.category.findMany();
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const products = [
    {
      slug: 'table-basse-olivier',
      category: 'mobilier',
      nameAr: 'طاولة قهوة من خشب الزيتون',
      nameFr: 'Table basse en olivier',
      shortDescriptionAr: 'طاولة قهوة مصنوعة يدويًا من خشب الزيتون التونسي.',
      shortDescriptionFr: 'Table basse artisanale en olivier tunisien.',
      descriptionAr:
        'قطعة فريدة منحوتة يدويًا، تُبرز عروق خشب الزيتون الطبيعية.',
      descriptionFr:
        "Pièce unique sculptée à la main, révélant les veines naturelles de l'olivier.",
      sku: 'DH-MOB-001',
      price: 890,
      oldPrice: 1090,
      isFeatured: true,
    },
    {
      slug: 'chaise-artisanale',
      category: 'mobilier',
      nameAr: 'كرسي حرفي من الخشب',
      nameFr: 'Chaise artisanale en bois',
      shortDescriptionAr: 'كرسي مريح بتصميم بسيط وأنيق.',
      shortDescriptionFr: 'Chaise confortable au design épuré.',
      descriptionAr: 'مصنوعة من خشب صلب مع تشطيب طبيعي يدوم طويلًا.',
      descriptionFr:
        'Fabriquée en bois massif avec une finition naturelle durable.',
      sku: 'DH-MOB-002',
      price: 320,
      oldPrice: null,
      isFeatured: false,
    },
    {
      slug: 'bureau-bois-massif',
      category: 'mobilier',
      nameAr: 'مكتب من الخشب الصلب',
      nameFr: 'Bureau en bois massif',
      shortDescriptionAr: 'مكتب واسع بأدراج عملية.',
      shortDescriptionFr: 'Bureau spacieux avec tiroirs pratiques.',
      descriptionAr: 'مساحة عمل أنيقة تجمع بين المتانة والجمال.',
      descriptionFr:
        'Un espace de travail élégant alliant robustesse et beauté.',
      sku: 'DH-MOB-003',
      price: 1250,
      oldPrice: null,
      isFeatured: true,
    },
    {
      slug: 'miroir-mural-sculpte',
      category: 'decoration',
      nameAr: 'مرآة حائط منحوتة',
      nameFr: 'Miroir mural sculpté',
      shortDescriptionAr: 'مرآة بإطار خشبي منحوت يدويًا.',
      shortDescriptionFr: 'Miroir au cadre en bois sculpté à la main.',
      descriptionAr: 'تضيف لمسة دافئة وأصيلة إلى أي جدار.',
      descriptionFr:
        'Apporte une touche chaleureuse et authentique à tout mur.',
      sku: 'DH-DEC-001',
      price: 240,
      oldPrice: 300,
      isFeatured: false,
    },
    {
      slug: 'vase-ceramique',
      category: 'decoration',
      nameAr: 'مزهرية خزفية',
      nameFr: 'Vase en céramique',
      shortDescriptionAr: 'مزهرية خزفية مصنوعة يدويًا بألوان ترابية.',
      shortDescriptionFr: 'Vase en céramique fait main aux tons terreux.',
      descriptionAr: 'تصميم عصري مستوحى من الحرف التونسية التقليدية.',
      descriptionFr:
        "Design moderne inspiré de l'artisanat tunisien traditionnel.",
      sku: 'DH-DEC-002',
      price: 85,
      oldPrice: null,
      isFeatured: false,
    },
    {
      slug: 'lampe-table-tissee',
      category: 'luminaires',
      nameAr: 'مصباح طاولة منسوج',
      nameFr: 'Lampe de table tissée',
      shortDescriptionAr: 'مصباح بغطاء منسوج يدويًا.',
      shortDescriptionFr: 'Lampe à abat-jour tissé main.',
      descriptionAr: 'إضاءة دافئة تخلق أجواءً مريحة في المنزل.',
      descriptionFr: 'Une lumière chaude pour une ambiance cosy.',
      sku: 'DH-LUM-001',
      price: 180,
      oldPrice: null,
      isFeatured: true,
    },
    {
      slug: 'suspension-rotin',
      category: 'luminaires',
      nameAr: 'ثريا من الروطان',
      nameFr: 'Suspension en rotin',
      shortDescriptionAr: 'ثريا معلّقة من الروطان الطبيعي.',
      shortDescriptionFr: 'Suspension en rotin naturel.',
      descriptionAr: 'قطعة مميزة تضفي طابعًا بوهيميًا أنيقًا.',
      descriptionFr: 'Une pièce forte au style bohème chic.',
      sku: 'DH-LUM-002',
      price: 350,
      oldPrice: 420,
      isFeatured: false,
    },
    {
      slug: 'planche-decouper-olivier',
      category: 'cuisine',
      nameAr: 'لوح تقطيع من الزيتون',
      nameFr: 'Planche à découper en olivier',
      shortDescriptionAr: 'لوح تقطيع متين من خشب الزيتون.',
      shortDescriptionFr: 'Planche à découper robuste en olivier.',
      descriptionAr: 'مثالية للمطبخ، سهلة التنظيف وطويلة العمر.',
      descriptionFr: 'Idéale en cuisine, facile à entretenir et durable.',
      sku: 'DH-CUI-001',
      price: 65,
      oldPrice: null,
      isFeatured: false,
    },
    {
      slug: 'set-bols-bois',
      category: 'cuisine',
      nameAr: 'طقم أوعية خشبية',
      nameFr: 'Set de bols en bois',
      shortDescriptionAr: 'طقم من أربعة أوعية خشبية مصنوعة يدويًا.',
      shortDescriptionFr: 'Set de quatre bols en bois faits main.',
      descriptionAr: 'مناسبة للتقديم والاستعمال اليومي.',
      descriptionFr: "Parfaits pour le service et l'usage quotidien.",
      sku: 'DH-CUI-002',
      price: 120,
      oldPrice: 150,
      isFeatured: true,
    },
  ];

  let count = 0;
  for (const p of products) {
    const categoryId = idBySlug.get(p.category) ?? null;
    const data = {
      nameAr: p.nameAr,
      nameFr: p.nameFr,
      shortDescriptionAr: p.shortDescriptionAr,
      shortDescriptionFr: p.shortDescriptionFr,
      descriptionAr: p.descriptionAr,
      descriptionFr: p.descriptionFr,
      sku: p.sku,
      price: p.price,
      oldPrice: p.oldPrice,
      status: 'ACTIVE' as const,
      isFeatured: p.isFeatured,
      categoryId,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data, inventory: { create: {} } },
    });
    count += 1;
  }
  console.log(`  ✓ ${count} example products`);
}

async function seedSettings(): Promise<void> {
  // Create the delivery pricing row once; never overwrite admin-set values.
  await prisma.setting.upsert({
    where: { key: 'delivery' },
    update: {},
    create: {
      key: 'delivery',
      value: JSON.stringify({ fee: 0, freeShippingThreshold: 0 }),
    },
  });
  console.log('  \u2713 settings');
}

async function main(): Promise<void> {
  console.log('Seeding Darya admin database...');
  const permissionIds = await seedPermissions();
  const roleIds = await seedRoles(permissionIds);
  const superAdminRoleId = roleIds.get('SUPER_ADMIN');
  if (!superAdminRoleId) {
    throw new Error('SUPER_ADMIN role was not created');
  }
  await seedSuperAdmin(superAdminRoleId);
  await seedSettings();

  // Demo catalog (example categories + products) is dev-only. In prod set
  // SEED_DEMO=false so restarts never recreate or revert catalog rows — the
  // real catalog is managed entirely from the dashboard. Roles, permissions
  // and the super-admin above always seed (they must stay in sync).
  if (process.env.SEED_DEMO !== 'false') {
    await seedCategories();
    await seedProducts();
  } else {
    console.log('  ⤓ SEED_DEMO=false — skipping demo categories & products');
  }

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
