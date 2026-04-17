/*
  Warnings:

  - Added the required column `updatedAt` to the `PII` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pii` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `ProcessingBasis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `processingType` ENUM('PI', 'SPI') NOT NULL,
    `basisNum` ENUM('TYPE_1', 'TYPE_2', 'TYPE_3', 'TYPE_4', 'TYPE_5', 'TYPE_6') NOT NULL,
    `pii_ID` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProcessingBasis_pii_ID_idx`(`pii_ID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProcessingBasis` ADD CONSTRAINT `ProcessingBasis_pii_ID_fkey` FOREIGN KEY (`pii_ID`) REFERENCES `PII`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
