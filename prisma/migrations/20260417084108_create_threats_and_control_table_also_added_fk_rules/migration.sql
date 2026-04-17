-- CreateTable
CREATE TABLE `ThreatsAndControll` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataSubject_id` INTEGER NOT NULL,
    `pdlc_id` INTEGER NOT NULL,
    `threats_possibleConsequences` VARCHAR(255) NOT NULL,
    `typeOfThreats` CHAR(255) NOT NULL,
    `severtyLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NOT NULL,
    `likelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NOT NULL,
    `riskRating` INTEGER NOT NULL,
    `proposedControl` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ThreatsAndControll_dataSubject_id_idx`(`dataSubject_id`),
    INDEX `ThreatsAndControll_pdlc_id_idx`(`pdlc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ThreatsAndControll` ADD CONSTRAINT `ThreatsAndControll_dataSubject_id_fkey` FOREIGN KEY (`dataSubject_id`) REFERENCES `DataSubjectInfo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreatsAndControll` ADD CONSTRAINT `ThreatsAndControll_pdlc_id_fkey` FOREIGN KEY (`pdlc_id`) REFERENCES `PDLC`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
