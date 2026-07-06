-- DropForeignKey
ALTER TABLE `pii` DROP FOREIGN KEY `PII_piProcessBasis_id_fkey`;

-- DropForeignKey
ALTER TABLE `pii` DROP FOREIGN KEY `PII_spiProcessBasis_id_fkey`;

-- AlterTable
ALTER TABLE `pii` MODIFY `piProcessBasis_id` INTEGER NULL,
    MODIFY `spiProcessBasis_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_piProcessBasis_id_fkey` FOREIGN KEY (`piProcessBasis_id`) REFERENCES `ProcessingBasis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_spiProcessBasis_id_fkey` FOREIGN KEY (`spiProcessBasis_id`) REFERENCES `ProcessingBasis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
