/*
  Warnings:

  - The values [CLIENTS] on the enum `DataSubjectTypes_dataSubjectType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `datasubjecttypes` MODIFY `dataSubjectType` ENUM('STUDENTS', 'PATIENTS', 'PARENTS', 'EMPLOYEES', 'SUPPLIERS', 'OTHERS') NOT NULL;
