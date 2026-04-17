/*
  Warnings:

  - Added the required column `dataSubjectsType_id` to the `PII` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pii` ADD COLUMN `dataSubjectsType_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `DataSubjectTypes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataSubjectType` ENUM('EMPLOYEES', 'CUSTOMERS', 'CLIENTS', 'SUPPLIERS') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PII_dataSubjectsType_id_idx` ON `PII`(`dataSubjectsType_id`);

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_dataSubjectsType_id_fkey` FOREIGN KEY (`dataSubjectsType_id`) REFERENCES `DataSubjectTypes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
