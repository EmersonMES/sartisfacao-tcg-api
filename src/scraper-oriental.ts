import { chromium } from 'playwright';
import { buscarColecao } from './utils/dicionarioColecoes';

async function iniciarScraperOriental() {
    const pesquisaUsuario = "Fenda Paradoxal";
    const colecao = buscarColecao(pesquisaUsuario);

    if (!colecao) return;

    // O Japão divide a Fenda Paradoxal em duas coleções. Vamos extrair a primeira: sv4K (Ancient Roar)
    const siglaJaponesa = colecao.siglaOriental[0]; 
    
    console.log(`\n🌸 Robô Oriental Ativado! Destino: Japão`);
    console.log(`➡️ Alvo: ${colecao.nomePtBr} | Sigla Oriental: ${siglaJaponesa}`);

    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Para fins de teste da arquitetura, usamos a mesma fonte visual para não atrasar o processo
        const urlFonte = `https://limitlesstcg.com/cards/${colecao.siglaOcidental}`;
        await page.goto(urlFonte, { waitUntil: 'domcontentloaded' });
        
        // Vamos processar apenas as 2 primeiras cartas, tal como fizemos no robô ocidental
        for (let i = 0; i < 2; i++) {
            const numeroJapones = i + 1; 
            
            // O ID Físico da carta no Japão (ex: sv4k-1)
            const id_oficial_japones = `${siglaJaponesa.toLowerCase()}-${numeroJapones}`;
            
            // O FIO INVISÍVEL: Aqui nós dizemos à API que esta carta é a mesma do ocidente!
            const id_global = `${colecao.nomeEn.toLowerCase().replace(/\s+/g, '-')}-${numeroJapones}`;

            console.log(`\n===========================================`);
            console.log(`🎎 Processando Carta Japonesa: ${id_oficial_japones} | Global: ${id_global}`);
            console.log(`===========================================`);
            
            const pacoteDeDados = {
                id_oficial: id_oficial_japones,
                id_global: id_global,
                numero: `00${numeroJapones}/066`, // A numeração asiática é completamente diferente!
                raridade: 'C', // O Japão usa letras (C, U, R, RR, SR) em vez de palavras
                colecao: 'Ancient Roar', // O nome da mini-coleção japonesa
                language: 'JAPANESE',
                nome: `Carta Japonesa ${numeroJapones}`, 
                descricao: `Textos extraídos diretamente da base de dados de Tóquio...`,
                url_imagem: `https://site-imagem.com/${siglaJaponesa}/${numeroJapones}_JP.png`
            };

            const resposta = await fetch('http://localhost:3000/cartas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pacoteDeDados)
            });

            if (resposta.status === 201) {
                console.log(`   ✅ SUCESSO: Tradução JAPANESE amarrada ao Fio Invisível!`);
            } else {
                console.log(`   ⚠️ AVISO: A API retornou status ${resposta.status}`);
            }
        }
    } catch (erro) {
        console.error('❌ Erro:', erro);
    } finally {
        await browser.close();
        console.log(`\n⛩️ Missão Oriental Concluída!`);
    }
}

iniciarScraperOriental();