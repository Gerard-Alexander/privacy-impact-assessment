/*
  Warnings:

  - You are about to drop the column `collection` on the `pdlc` table. All the data in the column will be lost.
  - You are about to drop the column `dataSharing` on the `pdlc` table. All the data in the column will be lost.
  - You are about to drop the column `dateCollected` on the `pdlc` table. All the data in the column will be lost.
  - You are about to drop the column `process` on the `pdlc` table. All the data in the column will be lost.
  - You are about to drop the column `sharedTo` on the `pdlc` table. All the data in the column will be lost.
  - You are about to drop the column `useOfData` on the `pdlc` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `pdlc` DROP COLUMN `collection`,
    DROP COLUMN `dataSharing`,
    DROP COLUMN `dateCollected`,
    DROP COLUMN `process`,
    DROP COLUMN `sharedTo`,
    DROP COLUMN `useOfData`;

-- CreateTable
CREATE TABLE `PDLCCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pdlc_id` INTEGER NOT NULL,
    `dateCollected` DATETIME(3) NULL,
    `collection` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PDLCCollection_pdlc_id_idx`(`pdlc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PDLCUse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pdlc_id` INTEGER NOT NULL,
    `useOfData` VARCHAR(255) NOT NULL,
    `process` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PDLCUse_pdlc_id_idx`(`pdlc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PDLCSharing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pdlc_id` INTEGER NOT NULL,
    `dataSharing` VARCHAR(255) NOT NULL,
    `sharedTo` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PDLCSharing_pdlc_id_idx`(`pdlc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PDLCCollection` ADD CONSTRAINT `PDLCCollection_pdlc_id_fkey` FOREIGN KEY (`pdlc_id`) REFERENCES `PDLC`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PDLCUse` ADD CONSTRAINT `PDLCUse_pdlc_id_fkey` FOREIGN KEY (`pdlc_id`) REFERENCES `PDLC`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PDLCSharing` ADD CONSTRAINT `PDLCSharing_pdlc_id_fkey` FOREIGN KEY (`pdlc_id`) REFERENCES `PDLC`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
