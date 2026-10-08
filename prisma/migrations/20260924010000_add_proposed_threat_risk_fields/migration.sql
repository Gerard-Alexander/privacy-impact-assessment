ALTER TABLE `threatsandcontrol`
    ADD COLUMN `proposedSeverityLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NULL,
    ADD COLUMN `proposedLikelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NULL,
    ADD COLUMN `proposedRiskRating` INTEGER NULL,
    ADD COLUMN `proposedTypeOfMeasure` VARCHAR(255) NULL;
