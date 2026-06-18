/*
  Warnings:

  - The values [CUSTOMERS] on the enum `DataSubjectTypes_dataSubjectType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `datasubjecttypes` MODIFY `dataSubjectType` ENUM('EMPLOYEES', 'CLIENTS', 'SUPPLIERS') NOT NULL;
