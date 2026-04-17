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
