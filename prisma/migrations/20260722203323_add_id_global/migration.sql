/*
  Warnings:

  - Changed the type of `language` on the `CardTranslation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `descricao` on table `CardTranslation` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "id_global" TEXT;

-- AlterTable
ALTER TABLE "CardTranslation" DROP COLUMN "language",
ADD COLUMN     "language" TEXT NOT NULL,
ALTER COLUMN "descricao" SET NOT NULL;

-- DropEnum
DROP TYPE "Language";

-- CreateIndex
CREATE UNIQUE INDEX "CardTranslation_card_id_language_key" ON "CardTranslation"("card_id", "language");
