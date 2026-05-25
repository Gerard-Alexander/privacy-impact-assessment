-- AlterTable
ALTER TABLE `piaassessment` ADD COLUMN `creatorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `threatsandcontrol` MODIFY `threats_possibleConsequences` VARCHAR(255) NULL,
    MODIFY `typeOfThreats` VARCHAR(255) NULL,
    MODIFY `proposedControl` VARCHAR(255) NULL,
    MODIFY `typeOfMeasure` VARCHAR(255) NULL,
    MODIFY `afterLikelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NULL,
    MODIFY `afterRiskRating` INTEGER NULL,
    MODIFY `afterSeverityLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NULL,
    MODIFY `currentLikelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NULL,
    MODIFY `currentRiskRating` INTEGER NULL,
    MODIFY `currentSeverityLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NULL;

-- CreateTable
CREATE TABLE `AssessmentShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `piaAssessment_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssessmentShare_piaAssessment_id_idx`(`piaAssessment_id`),
    INDEX `AssessmentShare_user_id_idx`(`user_id`),
    UNIQUE INDEX `AssessmentShare_piaAssessment_id_user_id_key`(`piaAssessment_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PiaAssessment_creatorId_idx` ON `PiaAssessment`(`creatorId`);

-- AddForeignKey
ALTER TABLE `PiaAssessment` ADD CONSTRAINT `PiaAssessment_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentShare` ADD CONSTRAINT `AssessmentShare_piaAssessment_id_fkey` FOREIGN KEY (`piaAssessment_id`) REFERENCES `PiaAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentShare` ADD CONSTRAINT `AssessmentShare_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
