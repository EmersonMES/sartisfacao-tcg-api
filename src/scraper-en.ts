import { chromium } from 'playwright';

async function iniciarScraperEN() {
  console.log('🕵️‍♂️ Robô da Sartisfação (Edição Internacional - INGLÊS) ativado...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    console.log(`🌐 Acedendo à base de dados Internacional (Paradox Rift)...`);
    await page.goto('https://limitlesstcg.com/cards/PAR', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log(`📖 A analisar a grelha de cartas em Inglês...`);
    const elementosCartas = await page.locator('a[href^="/cards/PAR/"]:has(img)').all();

    console.log(`\n🚀 Extraindo ${elementosCartas.length} cartas e enviando para a API...`);

    // Tiramos o limite! Agora vai passar por todas as cartas encontradas
    for (let i = 0; i < elementosCartas.length; i++) {
        const href = await elementosCartas[i].getAttribute('href') || '';
        const img = elementosCartas[i].locator('img');
        const url_imagem = await img.getAttribute('src') || '';
        
        // Estratégia agressiva para achar o nome (alt, title ou texto do link)
        let nomeCarta = await img.getAttribute('alt') || await img.getAttribute('title') || await elementosCartas[i].innerText();
        nomeCarta = nomeCarta.replace(/\n/g, '').trim();

        const numeroCarta = href.split('/').pop() || '0';
        const id_oficial = `par-${numeroCarta}`;

        console.log(`➡️ Carta ${i + 1}/${elementosCartas.length}: ${nomeCarta} | ID Oficial: ${id_oficial}`);

        const pacoteDeDados = {
            id_oficial: id_oficial,
            numero: `${numeroCarta}/182`,
            raridade: 'Unknown', 
            colecao: 'Paradox Rift',
            language: 'ENGLISH', 
            nome: nomeCarta,
            descricao: 'English data sync successful.',
            url_imagem: url_imagem
        };

        try {
            const resposta = await fetch('http://localhost:3000/cartas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pacoteDeDados)
            });

            if (resposta.status !== 201) {
                console.log(`   ⚠️ AVISO: A API retornou status ${resposta.status}`);
            }
        } catch (erroDeConexao) {
            console.log(`   ❌ ERRO de conexão com a API.`);
        }
    }

    console.log(`\n🏆 Sincronização Multilíngue Concluída com Sucesso!`);

  } catch (erro) {
    console.error('❌ Erro:', erro);
  } finally {
    console.log('🤖 A desligar...');
    await browser.close();
  }
}

iniciarScraperEN();