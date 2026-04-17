-- CreateTable
CREATE TABLE `Questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Answers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `answer` VARCHAR(255) NOT NULL,
    `question_Id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Answers_question_Id_idx`(`question_Id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Answers` ADD CONSTRAINT `Answers_question_Id_fkey` FOREIGN KEY (`question_Id`) REFERENCES `Questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
