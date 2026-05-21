/*
  Warnings:

  - You are about to drop the column `likelihoodLevel` on the `threatsandcontrol` table. All the data in the column will be lost.
  - You are about to drop the column `riskRating` on the `threatsandcontrol` table. All the data in the column will be lost.
  - You are about to drop the column `severityLevel` on the `threatsandcontrol` table. All the data in the column will be lost.
  - Added the required column `afterLikelihoodLevel` to the `ThreatsAndControl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `afterRiskRating` to the `ThreatsAndControl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `afterSeverityLevel` to the `ThreatsAndControl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentLikelihoodLevel` to the `ThreatsAndControl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentRiskRating` to the `ThreatsAndControl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentSeverityLevel` to the `ThreatsAndControl` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `threatsandcontrol` DROP COLUMN `likelihoodLevel`,
    DROP COLUMN `riskRating`,
    DROP COLUMN `severityLevel`,
    ADD COLUMN `afterLikelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NOT NULL,
    ADD COLUMN `afterRiskRating` INTEGER NOT NULL,
    ADD COLUMN `afterSeverityLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NOT NULL,
    ADD COLUMN `currentLikelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NOT NULL,
    ADD COLUMN `currentRiskRating` INTEGER NOT NULL,
    ADD COLUMN `currentSeverityLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NOT NULL;
