/*
  Warnings:

  - You are about to drop the column `original_name` on the `files` table. All the data in the column will be lost.
  - Added the required column `mime` to the `files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `files` DROP COLUMN `original_name`,
    ADD COLUMN `mime` VARCHAR(191) NOT NULL;
