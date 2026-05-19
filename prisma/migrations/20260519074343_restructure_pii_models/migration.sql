/*
  Warnings:

  - You are about to drop the column `dataSubject_id` on the `pii` table. All the data in the column will be lost.
  - You are about to drop the column `dataSubjectsType_id` on the `pii` table. All the data in the column will be lost.
  - You are about to drop the column `purposeOfProcessing` on the `pii` table. All the data in the column will be lost.
  - You are about to drop the column `recipientsUsers` on the `pii` table. All the data in the column will be lost.
  - You are about to drop the column `pii_ID` on the `processingbasis` table. All the data in the column will be lost.
  - You are about to alter the column `processingType` on the `processingbasis` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(255)`.
  - You are about to alter the column `basisNum` on the `processingbasis` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `VarChar(255)`.
  - You are about to drop the `datasubjectinfo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `piProcessBasis_id` to the `PII` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spiProcessBasis_id` to the `PII` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `ProcessingBasis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyword` to the `ProcessingBasis` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `pii` DROP FOREIGN KEY `PII_dataSubject_id_fkey`;

-- DropForeignKey
ALTER TABLE `pii` DROP FOREIGN KEY `PII_dataSubjectsType_id_fkey`;

-- DropForeignKey
ALTER TABLE `processingbasis` DROP FOREIGN KEY `ProcessingBasis_pii_ID_fkey`;

-- DropForeignKey
ALTER TABLE `threatsandcontrol` DROP FOREIGN KEY `ThreatsAndControl_dataSubject_id_fkey`;

-- DropIndex
DROP INDEX `PII_dataSubject_id_idx` ON `pii`;

-- DropIndex
DROP INDEX `PII_dataSubjectsType_id_idx` ON `pii`;

-- DropIndex
DROP INDEX `ProcessingBasis_pii_ID_idx` ON `processingbasis`;

-- AlterTable
ALTER TABLE `pii` DROP COLUMN `dataSubject_id`,
    DROP COLUMN `dataSubjectsType_id`,
    DROP COLUMN `purposeOfProcessing`,
    DROP COLUMN `recipientsUsers`,
    ADD COLUMN `piProcessBasis_id` INTEGER NOT NULL,
    ADD COLUMN `spiProcessBasis_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `processingbasis` DROP COLUMN `pii_ID`,
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `keyword` VARCHAR(255) NOT NULL,
    MODIFY `processingType` VARCHAR(255) NOT NULL,
    MODIFY `basisNum` VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE `datasubjectinfo`;

-- CreateTable
CREATE TABLE `PiiDatasubject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pii_id` INTEGER NOT NULL,
    `dataSubjectsType_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PiiDatasubject_pii_id_idx`(`pii_id`),
    INDEX `PiiDatasubject_dataSubjectsType_id_idx`(`dataSubjectsType_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecipientUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pii_id` INTEGER NOT NULL,
    `recipientName` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RecipientUser_pii_id_idx`(`pii_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PII_piProcessBasis_id_idx` ON `PII`(`piProcessBasis_id`);

-- CreateIndex
CREATE INDEX `PII_spiProcessBasis_id_idx` ON `PII`(`spiProcessBasis_id`);

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_piProcessBasis_id_fkey` FOREIGN KEY (`piProcessBasis_id`) REFERENCES `ProcessingBasis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_spiProcessBasis_id_fkey` FOREIGN KEY (`spiProcessBasis_id`) REFERENCES `ProcessingBasis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PiiDatasubject` ADD CONSTRAINT `PiiDatasubject_pii_id_fkey` FOREIGN KEY (`pii_id`) REFERENCES `PII`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PiiDatasubject` ADD CONSTRAINT `PiiDatasubject_dataSubjectsType_id_fkey` FOREIGN KEY (`dataSubjectsType_id`) REFERENCES `DataSubjectTypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipientUser` ADD CONSTRAINT `RecipientUser_pii_id_fkey` FOREIGN KEY (`pii_id`) REFERENCES `PII`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreatsAndControl` ADD CONSTRAINT `ThreatsAndControl_dataSubject_id_fkey` FOREIGN KEY (`dataSubject_id`) REFERENCES `PiiDatasubject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
