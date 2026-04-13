-- CreateTable
CREATE TABLE `AuthortizedParties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `usetType` ENUM('HEAD_OFFICE', 'COMPLIANCE_OFFICER', 'REVIEWER', 'APPROVED_BY') NOT NULL,
    `signature` TEXT NULL,
    `dateSigned` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `PII` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `formNo` INTEGER NOT NULL,
    `formName` VARCHAR(255) NOT NULL,
    `dataProcessing` ENUM('ELECRONIC', 'PAPER_BASED', 'BOTH') NOT NULL,
    `dataSubjects` ENUM('EMPLOYEES', 'CUSTOMERS', 'CLIENTS', 'SUPPLIERS') NOT NULL,
    `dataSubjectID` INTEGER NOT NULL,

    INDEX `PII_dataSubjectID_idx`(`dataSubjectID`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataSubjectInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mobileNumber` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_dataSubjectID_fkey` FOREIGN KEY (`dataSubjectID`) REFERENCES `DataSubjectInfo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
