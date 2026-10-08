-- CreateTable
CREATE TABLE `PiiProcessingBasis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pii_id` INTEGER NOT NULL,
    `processingBasis_id` INTEGER NOT NULL,
    `processingType` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PiiProcessingBasis_pii_id_processingBasis_id_processingType_key`(`pii_id`, `processingBasis_id`, `processingType`),
    INDEX `PiiProcessingBasis_pii_id_idx`(`pii_id`),
    INDEX `PiiProcessingBasis_processingBasis_id_idx`(`processingBasis_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PiiProcessingBasis` ADD CONSTRAINT `PiiProcessingBasis_pii_id_fkey`
FOREIGN KEY (`pii_id`) REFERENCES `PII`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PiiProcessingBasis` ADD CONSTRAINT `PiiProcessingBasis_processingBasis_id_fkey`
FOREIGN KEY (`processingBasis_id`) REFERENCES `ProcessingBasis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
