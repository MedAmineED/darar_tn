-- Optional request identity belongs to the order stock ledger, not snapshots.
ALTER TABLE `order_inventory`
  ADD COLUMN `creationKey` VARCHAR(191) NULL,
  ADD COLUMN `requestHash` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `order_inventory_creationKey_key` ON `order_inventory`(`creationKey`);
