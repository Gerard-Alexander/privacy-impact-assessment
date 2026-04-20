/*
  Warnings:

  - The values [ELECRONIC] on the enum `PII_dataProcessing` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `authortizedparties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `threatsandcontroll` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `piaAssessment_id` to the `PDLC` table without a default value. This is not possible if the table is not empty.
  - Added the required column `piaAssessment_id` to the `PII` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purposeOfProcessing` to the `PII` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientsUsers` to the `PII` table without a default value. This is not possible if the table is not empty.
  - Added the required column `piaAssessment_id` to the `SecurityMeasures` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `answers` DROP FOREIGN KEY `Answers_question_Id_fkey`;

-- DropForeignKey
ALTER TABLE `processingbasis` DROP FOREIGN KEY `ProcessingBasis_pii_ID_fkey`;

-- DropForeignKey
ALTER TABLE `threatsandcontroll` DROP FOREIGN KEY `ThreatsAndControll_dataSubject_id_fkey`;

-- DropForeignKey
ALTER TABLE `threatsandcontroll` DROP FOREIGN KEY `ThreatsAndControll_pdlc_id_fkey`;

-- AlterTable
ALTER TABLE `pdlc` ADD COLUMN `piaAssessment_id` INTEGER NOT NULL,
    MODIFY `dateCollected` VARCHAR(255) NOT NULL,
    MODIFY `retentionPeriod` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `pii` ADD COLUMN `piaAssessment_id` INTEGER NOT NULL,
    ADD COLUMN `purposeOfProcessing` TEXT NOT NULL,
    ADD COLUMN `recipientsUsers` VARCHAR(255) NOT NULL,
    MODIFY `dataProcessing` ENUM('ELECTRONIC', 'PAPER_BASED', 'BOTH') NOT NULL;

-- AlterTable
ALTER TABLE `securitymeasures` ADD COLUMN `piaAssessment_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `answers`;

-- DropTable
DROP TABLE `authortizedparties`;

-- DropTable
DROP TABLE `questions`;

-- DropTable
DROP TABLE `threatsandcontroll`;

-- CreateTable
CREATE TABLE `PiaAssessment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dpsName` VARCHAR(255) NOT NULL,
    `mandate` TEXT NOT NULL,
    `dpsModality` ENUM('MANUAL', 'ELECTRONIC', 'BOTH') NOT NULL,
    `processingRole` ENUM('PIC', 'PIP') NOT NULL,
    `isOutsourced` BOOLEAN NOT NULL,
    `piaStartDate` DATETIME(3) NOT NULL,
    `piaEndDate` DATETIME(3) NOT NULL,
    `privacyNoticeAcknowledged` BOOLEAN NOT NULL DEFAULT false,
    `isDataTransferredOutsidePh` BOOLEAN NULL,
    `hasDataSharingAgreement` BOOLEAN NULL,
    `pipName` VARCHAR(255) NULL,
    `isPublicFacing` ENUM('EXTERNAL', 'INTERNAL', 'BOTH') NULL,
    `hasAutomatedDecisionMaking` BOOLEAN NULL,
    `hasProfiling` BOOLEAN NULL,
    `legalBasis` VARCHAR(255) NULL,
    `otherLegalBasisInfo` TEXT NULL,
    `isConsentUsed` BOOLEAN NULL,
    `consentProof` ENUM('CONSENT_FORM', 'OTHER_PROOF', 'BOTH') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthorizedParties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `piaAssessment_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(255) NOT NULL,
    `officeUnit` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `userType` ENUM('HEAD_OFFICE', 'COMPLIANCE_OFFICER', 'REVIEWER', 'APPROVED_BY') NOT NULL,
    `signature` TEXT NULL,
    `dateSigned` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AuthorizedParties_piaAssessment_id_idx`(`piaAssessment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThreatsAndControl` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `piaAssessment_id` INTEGER NOT NULL,
    `dataSubject_id` INTEGER NOT NULL,
    `pdlc_id` INTEGER NOT NULL,
    `threats_possibleConsequences` VARCHAR(255) NOT NULL,
    `typeOfThreats` VARCHAR(255) NOT NULL,
    `severityLevel` ENUM('NEGLIGIBLE_1', 'LIMITED_2', 'SIGNIFICANT_3', 'EXTREME_4') NOT NULL,
    `likelihoodLevel` ENUM('UNLIKELY_1', 'POSSIBLE_2', 'LIKELY_3', 'ALMOST_CERTAIN_4') NOT NULL,
    `riskRating` INTEGER NOT NULL,
    `proposedControl` VARCHAR(255) NOT NULL,
    `typeOfMeasure` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ThreatsAndControl_piaAssessment_id_idx`(`piaAssessment_id`),
    INDEX `ThreatsAndControl_dataSubject_id_idx`(`dataSubject_id`),
    INDEX `ThreatsAndControl_pdlc_id_idx`(`pdlc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `PDLC_piaAssessment_id_idx` ON `PDLC`(`piaAssessment_id`);

-- CreateIndex
CREATE INDEX `PII_piaAssessment_id_idx` ON `PII`(`piaAssessment_id`);

-- CreateIndex
CREATE INDEX `SecurityMeasures_piaAssessment_id_idx` ON `SecurityMeasures`(`piaAssessment_id`);

-- AddForeignKey
ALTER TABLE `AuthorizedParties` ADD CONSTRAINT `AuthorizedParties_piaAssessment_id_fkey` FOREIGN KEY (`piaAssessment_id`) REFERENCES `PiaAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PDLC` ADD CONSTRAINT `PDLC_piaAssessment_id_fkey` FOREIGN KEY (`piaAssessment_id`) REFERENCES `PiaAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PII` ADD CONSTRAINT `PII_piaAssessment_id_fkey` FOREIGN KEY (`piaAssessment_id`) REFERENCES `PiaAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessingBasis` ADD CONSTRAINT `ProcessingBasis_pii_ID_fkey` FOREIGN KEY (`pii_ID`) REFERENCES `PII`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreatsAndControl` ADD CONSTRAINT `ThreatsAndControl_piaAssessment_id_fkey` FOREIGN KEY (`piaAssessment_id`) REFERENCES `PiaAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreatsAndControl` ADD CONSTRAINT `ThreatsAndControl_dataSubject_id_fkey` FOREIGN KEY (`dataSubject_id`) REFERENCES `DataSubjectInfo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThreatsAndControl` ADD CONSTRAINT `ThreatsAndControl_pdlc_id_fkey` FOREIGN KEY (`pdlc_id`) REFERENCES `PDLC`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityMeasures` ADD CONSTRAINT `SecurityMeasures_piaAssessment_id_fkey` FOREIGN KEY (`piaAssessment_id`) REFERENCES `PiaAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
