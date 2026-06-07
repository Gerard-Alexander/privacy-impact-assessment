/*
  Warnings:

  - You are about to drop the column `retentionDate` on the `pdlc` table. All the data in the column will be lost.
  - You are about to drop the column `dateCollected` on the `pdlccollection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `pdlc` DROP COLUMN `retentionDate`,
    ADD COLUMN `retentionRemarks` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `pdlccollection` DROP COLUMN `dateCollected`,
    ADD COLUMN `collectionRemarks` VARCHAR(500) NULL;
