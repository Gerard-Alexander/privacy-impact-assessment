-- Allow custom values in the subject-type lookup table.
ALTER TABLE `DataSubjectTypes`
    MODIFY COLUMN `dataSubjectType` VARCHAR(255) NOT NULL;
