-- CreateTable
CREATE TABLE `PDLC` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stakeholderName` VARCHAR(255) NOT NULL,
    `dateCollected` DATETIME(3) NOT NULL,
    `collection` VARCHAR(255) NOT NULL,
    `useOfData` VARCHAR(255) NOT NULL,
    `process` VARCHAR(255) NOT NULL,
    `retentionPeriod` INTEGER NOT NULL,
    `retentionDate` DATETIME(3) NULL,
    `dataSharing` VARCHAR(255) NOT NULL,
    `sharedTo` VARCHAR(255) NOT NULL,
    `disposalMethod` VARCHAR(255) NOT NULL,
    `dlcDiagram` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
