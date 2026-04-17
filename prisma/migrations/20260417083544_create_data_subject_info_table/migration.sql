/*
  Warnings:

  - Added the required column `dataSubject_id` to the `PII` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pii` ADD COLUMN `dataSubject_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `DataSubjectInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mobileNumber` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PII_dataSubject_id_idx` ON `PII`(`dataSubject_id`);

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_dataSubject_id_fkey` FOREIGN KEY (`dataSubject_id`) REFERENCES `DataSubjectInfo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
