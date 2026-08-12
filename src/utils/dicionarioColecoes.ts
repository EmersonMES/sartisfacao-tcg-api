// src/utils/dicionarioColecoes.ts

export interface InformacaoColecao {
    nomePtBr: string;          // O nome que você vai digitar no terminal
    nomeEn: string;            // O nome oficial em Inglês (Útil para logs e APIs americanas)
    siglaOcidental: string;    // Sigla para idiomas: EN, PT-BR, FR, ES, IT, DE
    siglaOriental: string[];   // Array com as siglas Asiáticas correspondentes (JP, KO, TW, etc)
}

// O nosso banco de dados em memória
export const DicionarioDeColecoes: Record<string, InformacaoColecao> = {
    "fenda paradoxal": {
        nomePtBr: "Fenda Paradoxal",
        nomeEn: "Paradox Rift",
        siglaOcidental: "PAR",
        siglaOriental: ["sv4K", "sv4M"]
    },
    "forças temporais": {
        nomePtBr: "Forças Temporais",
        nomeEn: "Temporal Forces",
        siglaOcidental: "TEF",
        siglaOriental: ["sv5K", "sv5M"]
    },
    "crepúsculo mascarado": {
        nomePtBr: "Crepúsculo Mascarado",
        nomeEn: "Twilight Masquerade",
        siglaOcidental: "TWM",
        siglaOriental: ["sv6"]
    },
    "coroa estelar": {
        nomePtBr: "Coroa Estelar",
        nomeEn: "Stellar Crown",
        siglaOcidental: "SCR",
        siglaOriental: ["sv7"]
    },
    "faíscas deslumbrantes": {
        nomePtBr: "Faíscas Deslumbrantes",
        nomeEn: "Surging Sparks",
        siglaOcidental: "SSP",
        siglaOriental: ["sv7a", "sv8"]
    }
};

/**
 * Função inteligente para buscar a coleção.
 * Ela ignora letras maiúsculas/minúsculas e espaços extras.
 */
export function buscarColecao(nomePesquisa: string): InformacaoColecao | null {
    // Limpa a entrada do utilizador (ex: "   Fenda Paradoxal   " vira "fenda paradoxal")
    const nomeNormalizado = nomePesquisa.toLowerCase().trim();
    
    // Procura no dicionário
    const resultado = DicionarioDeColecoes[nomeNormalizado];
    
    if (resultado) {
        return resultado;
    } else {
        return null;
    }
}