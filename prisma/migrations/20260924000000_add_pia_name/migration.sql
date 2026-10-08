-- Add a stable, human-readable identifier for each assessment.
ALTER TABLE `PiaAssessment` ADD COLUMN `piaName` VARCHAR(50) NULL;

UPDATE `PiaAssessment`
SET `piaName` = CONCAT('PIA-DPO-', LPAD(`id`, 3, '0'))
WHERE `piaName` IS NULL;

CREATE UNIQUE INDEX `PiaAssessment_piaName_key` ON `PiaAssessment`(`piaName`);