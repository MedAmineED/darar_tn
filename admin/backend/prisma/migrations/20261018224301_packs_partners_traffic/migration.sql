-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `packId` VARCHAR(191) NULL,
    ADD COLUMN `packNameAr` VARCHAR(191) NULL,
    ADD COLUMN `packNameFr` VARCHAR(191) NULL,
    ADD COLUMN `unitCost` DECIMAL(10, 2) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `costPrice` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `packs` (
    `id` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `nameFr` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `descriptionAr` TEXT NULL,
    `descriptionFr` TEXT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `image` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `packs_slug_key`(`slug`),
    INDEX `packs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pack_items` (
    `packId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    INDEX `pack_items_productId_idx`(`productId`),
    PRIMARY KEY (`packId`, `productId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partners` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partner_entries` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `kind` ENUM('CONTRIBUTION', 'WITHDRAWAL') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partner_entries_partnerId_date_idx`(`partnerId`, `date`),
    INDEX `partner_entries_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `category` VARCHAR(100) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `paidByPartnerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_date_idx`(`date`),
    INDEX `expenses_paidByPartnerId_idx`(`paidByPartnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `site_sessions` (
    `id` VARCHAR(64) NOT NULL,
    `visitorId` VARCHAR(64) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pageViews` INTEGER NOT NULL DEFAULT 0,
    `landingPath` VARCHAR(500) NOT NULL,
    `referrer` VARCHAR(255) NULL,
    `device` VARCHAR(20) NOT NULL,
    `isNewVisitor` BOOLEAN NOT NULL DEFAULT true,

    INDEX `site_sessions_startedAt_idx`(`startedAt`),
    INDEX `site_sessions_visitorId_idx`(`visitorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_views` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(64) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `page_views_createdAt_idx`(`createdAt`),
    INDEX `page_views_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `order_items_packId_idx` ON `order_items`(`packId`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `packs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pack_items` ADD CONSTRAINT `pack_items_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `packs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pack_items` ADD CONSTRAINT `pack_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partner_entries` ADD CONSTRAINT `partner_entries_partnerId_fkey` FOREIGN KEY (`partnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_paidByPartnerId_fkey` FOREIGN KEY (`paidByPartnerId`) REFERENCES `partners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `page_views` ADD CONSTRAINT `page_views_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `site_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
