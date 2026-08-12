-- CreateEnum
CREATE TYPE "Language" AS ENUM ('CHINESE_SIMPLIFIED', 'CHINESE_TRADITIONAL', 'DUTCH', 'ENGLISH', 'FRENCH', 'GERMAN', 'INDONESIAN', 'ITALIAN', 'JAPANESE', 'KOREAN', 'POLISH', 'PORTUGUESE_BRAZIL', 'PORTUGUESE_PORTUGAL', 'RUSSIAN', 'SPANISH', 'THAI', 'SPANISH_LATIN_AMERICA');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "id_oficial" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "raridade" TEXT NOT NULL,
    "colecao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTranslation" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "url_imagem" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_id_oficial_key" ON "Card"("id_oficial");

-- CreateIndex
CREATE UNIQUE INDEX "CardTranslation_card_id_language_key" ON "CardTranslation"("card_id", "language");

-- AddForeignKey
ALTER TABLE "CardTranslation" ADD CONSTRAINT "CardTranslation_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
