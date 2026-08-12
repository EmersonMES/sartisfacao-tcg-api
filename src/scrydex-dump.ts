import { chromium } from 'playwright';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// A Chave Mestra: Lê qualquer JSON do painel, independentemente da palavra exata
async function extrairJSONBlindado(page: any) {
    console.log(`   👀 Aguardando o servidor carregar os dados do painel...`);
    
    try {
        // Espera Universal: Procura por "GET /pokemon" e as chaves "{" e "}"
        await page.waitForFunction(() => {
            const textoTotal = document.documentElement.textContent || '';
            return textoTotal.includes('GET /pokemon') && textoTotal.includes('{') && textoTotal.includes('}');
        }, { timeout: 20000 }); // Aumentámos a paciência para 20 segundos!

        const jsonExtraido = await page.evaluate(() => {
            const textoTotal = document.documentElement.textContent || '';
            
            // Puxa o ÚLTIMO painel que abriu na tela
            const indexOfMarker = textoTotal.lastIndexOf('GET /pokemon');
            if (indexOfMarker === -1) return null;

            const textAfterMarker = textoTotal.substring(indexOfMarker);
            const start = textAfterMarker.indexOf('{');
            const end = textAfterMarker.lastIndexOf('}');
            
            if (start !== -1 && end !== -1 && end > start) {
                return textAfterMarker.substring(start, end + 1);
            }
            return null;
        });

        return jsonExtraido;

    } catch (e) {
        console.log(`   ⚠️ Falha ao ler. O site demorou muito a responder ou bloqueou o robô.`);
        return null;
    }
}

async function iniciarExtracaoDireta(urlColecao: string) {
    console.log(`\n🤖 Iniciando Robô de Assalto Direto (Modo Texto Bruto) na URL:\n${urlColecao}`);

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log(`🌐 Acedendo diretamente à coleção...`);
        await page.goto(urlColecao, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        console.log(`📖 Clicando em 'VIEW API' para ler os dados mestres do Set...`);
        await page.getByText('VIEW API').first().click();

        // Extraímos o Set (O marcador é '/expansions/')
        const jsonSetBruto = await extrairJSONBlindado(page);
        
        if (!jsonSetBruto) throw new Error("O painel abriu, mas o robô não encontrou o JSON da coleção.");
        
        const dadosColecao = JSON.parse(jsonSetBruto);
        const totalCartas = dadosColecao.printed_total || dadosColecao.total || 0;
        const nomeColecao = dadosColecao.name || 'Desconhecida';
        
        console.log(`✅ Coleção identificada: ${nomeColecao} (${totalCartas} cartas).`);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        console.log(`📜 Rolando a página para renderizar todas as cartas...`);
        for (let s = 0; s < 5; s++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await page.waitForTimeout(800);
        }
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const linksDasCartas = page.locator('a[href*="/cards/"]');
        const cartasEncontradasNaTela = await linksDasCartas.count();

        console.log(`🃏 Encontradas ${cartasEncontradasNaTela} cartas visíveis. Iniciando a colheita...`);

        for (let i = 0; i < cartasEncontradasNaTela; i++) {
            console.log(`\n👉 Extraindo a carta ${i + 1} de ${cartasEncontradasNaTela}...`);
            
            await linksDasCartas.nth(i).click();
            await page.waitForTimeout(1500); 

            await page.getByText('VIEW API').last().click();

            // Extraímos a Carta (O marcador é '/cards/')
            const jsonCartaBruto = await extrairJSONBlindado(page);
            
            if (jsonCartaBruto) {
                try {
                    const dadosCompletos = JSON.parse(jsonCartaBruto);
                    const carta = dadosCompletos.data; 

                    if (carta) {
                        const nomeSetSlug = nomeColecao.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        const id_global = `${nomeSetSlug}-${i + 1}`;
                        
                        let descricaoAtaques = 'Nenhum ataque registrado.';
                        if (carta.attacks && carta.attacks.length > 0) {
                            descricaoAtaques = carta.attacks.map((atk: any) => `${atk.name} (${atk.damage || '0'}) - ${atk.text || ''}`).join(' | ');
                        }

                        const urlImagem = carta.image_url || carta.image || `https://images.scrydex.com/pokemon/${carta.id}/image`;

                        const pacoteDeDados = {
                            id_oficial: carta.id,
                            id_global: id_global,
                            numero: `${i + 1}/${totalCartas}`,
                            raridade: carta.rarity || 'Comum',
                            colecao: nomeColecao,
                            language: 'ENGLISH',
                            nome: carta.name || 'Desconhecido',
                            descricao: descricaoAtaques,
                            url_imagem: urlImagem
                        };

                        const resLocal = await fetch('http://localhost:3000/cartas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(pacoteDeDados)
                        });

                        if (resLocal.status === 201) {
                            console.log(`   ✅ Guardado no seu Banco de Dados: ${carta.name} (${carta.id})`);
                        }
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Falha ao transformar o texto num JSON válido.`);
                }
            } else {
                console.log(`   ⚠️ Painel vazio ou texto não detetado.`);
            }

            console.log(`   🔙 Fechando a carta...`);
            await page.keyboard.press('Escape'); 
            await page.waitForTimeout(500);
            await page.keyboard.press('Escape'); 
            await page.waitForTimeout(1000);
        }

        console.log(`\n🏆 Extração Visual da Coleção Concluída com Sucesso Absoluto!`);

    } catch (erro: any) {
        console.error('❌ Erro Fatal no Robô:', erro.message);
    } finally {
        await browser.close();
    }
}

rl.question('\n🔗 Cole a URL DIRETA da coleção (ex: https://scrydex.com/pokemon/expansions/base/base1): ', (resposta) => {
    const urlEscolhida = resposta.trim();
    
    if (urlEscolhida && urlEscolhida.startsWith('http')) {
        iniciarExtracaoDireta(urlEscolhida).then(() => rl.close());
    } else {
        console.log('❌ Operação cancelada. URL inválida.');
        rl.close();
    }
});