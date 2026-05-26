-- AlterTable
ALTER TABLE `piaassessment` ADD COLUMN `statusBeforeArchive` ENUM('DRAFT', 'COMPLETED', 'ARCHIVED') NULL;
