-- AlterTable
ALTER TABLE `site_sessions` ADD COLUMN `city` VARCHAR(120) NULL,
    ADD COLUMN `country` VARCHAR(2) NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `region` VARCHAR(10) NULL;

-- CreateIndex
CREATE INDEX `site_sessions_country_startedAt_idx` ON `site_sessions`(`country`, `startedAt`);
