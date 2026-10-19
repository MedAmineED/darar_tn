-- CreateTable
CREATE TABLE `inventory_items` (
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inventory_items_quantity_idx`(`quantity`),
    PRIMARY KEY (`productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_inventory` (
    `orderId` VARCHAR(191) NOT NULL,
    `state` ENUM('LEGACY', 'UNCOMMITTED', 'DEDUCTED', 'RESTORED') NOT NULL DEFAULT 'UNCOMMITTED',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`orderId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `kind` ENUM('ADJUSTMENT', 'DEDUCTION', 'RESTORATION') NOT NULL,
    `delta` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `productNameAr` VARCHAR(191) NOT NULL,
    `productNameFr` VARCHAR(191) NOT NULL,
    `productSku` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_productId_createdAt_idx`(`productId`, `createdAt`),
    INDEX `stock_movements_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `stock_movements_orderId_productId_kind_key`(`orderId`, `productId`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `customers_createdAt_idx` ON `customers`(`createdAt`);

-- CreateIndex
CREATE INDEX `orders_paymentStatus_status_createdAt_idx` ON `orders`(`paymentStatus`, `status`, `createdAt`);

-- AddForeignKey
ALTER TABLE `inventory_items` ADD CONSTRAINT `inventory_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_inventory` ADD CONSTRAINT `order_inventory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `inventory_items`(`productId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order_inventory`(`orderId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Establish zero balances only. Never infer on-hand stock from catalog or sales.
INSERT INTO inventory_items (productId, quantity, lowStockThreshold, updatedAt)
SELECT id, 0, 0, CURRENT_TIMESTAMP(3) FROM products;
-- Every pre-migration order is explicitly exempt, even if still pending.
INSERT INTO order_inventory (orderId, state, updatedAt)
SELECT id, 'LEGACY', CURRENT_TIMESTAMP(3) FROM orders;

ALTER TABLE inventory_items ADD CONSTRAINT inventory_quantity_nonnegative CHECK (quantity >= 0), ADD CONSTRAINT inventory_threshold_nonnegative CHECK (lowStockThreshold >= 0);
ALTER TABLE stock_movements ADD CONSTRAINT movement_balance_nonnegative CHECK (balanceAfter >= 0), ADD CONSTRAINT movement_delta_nonzero CHECK (delta <> 0);

-- Add permissions without resetting existing role/custom assignments.
INSERT INTO permissions (id, name, resource, action, createdAt) VALUES
('inventory-read-v1', 'inventory:read', 'inventory', 'read', CURRENT_TIMESTAMP(3)),
('inventory-adjust-v1', 'inventory:adjust', 'inventory', 'adjust', CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO role_permissions (roleId, permissionId)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE (r.name IN ('SUPER_ADMIN', 'ADMIN') AND p.resource = 'inventory')
   OR (r.name = 'MANAGER' AND p.name = 'inventory:read');
