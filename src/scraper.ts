import { chromium } from 'playwright';

async function iniciarScraper() {
  console.log('🕵️‍♂️ Robô da Sartisfação ativado para Extração Profunda...');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    console.log(`🌐 Acessando a página de Edições...`);
    await page.goto('https://www.ligapokemon.com.br/?view=cards/edicoes', { waitUntil: 'domcontentloaded' });

    const termoPesquisa = 'Fenda Paradoxal'; 
    const nomeExibidoNoSite = 'Paradox Rift'; 
    const colecaoNome = 'Fenda Paradoxal';

    await page.getByPlaceholder('Procure sua edição aqui').pressSequentially(termoPesquisa, { delay: 100 });
    await page.waitForTimeout(2000); 

    await page.locator('a', { hasText: nomeExibidoNoSite }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    console.log(`\n🔽 Carregando cartas (Rolagem rápida)...`);
    let tentativas = 0;
    let cartasAnteriores = 0;
    while (true) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500); 
        const cartasAtuais = await page.locator('a[href*="?view=cards/card"] img').count();
        if (cartasAtuais === cartasAnteriores) {
            tentativas++;
            if (tentativas >= 3) break;
        } else {
            tentativas = 0; 
        }
        cartasAnteriores = cartasAtuais;
    }

    const elementosCartas = await page.locator('a[href*="?view=cards/card"]:has(img)').all();
    
    // Continuamos com o limite de 3 apenas para validar a extração de texto
    const limiteTeste = elementosCartas.length; 
    console.log(`\n🚀 Iniciando Leitura de Textos (Top ${limiteTeste})...`);

    for (let i = 0; i < limiteTeste; i++) {
        const linkRelativo = await elementosCartas[i].getAttribute('href');
        const linkCompleto = `https://www.ligapokemon.com.br/${linkRelativo}`;
        const img = elementosCartas[i].locator('img');
        const url_imagem = await img.getAttribute('src') || '';
        
        console.log(`\n➡️ Analisando Textos da Carta ${i + 1}/${limiteTeste}...`);
        
        const pageCarta = await context.newPage();
        await pageCarta.goto(linkCompleto, { waitUntil: 'domcontentloaded' });
        
        const tituloPagina = await pageCarta.title();
        let nomeCarta = tituloPagina.split('(')[0].trim();
        let numeroCarta = tituloPagina.includes('(') ? tituloPagina.split('(')[1].split(')')[0] : 'S/N';
        const id_oficial = `par-${numeroCarta.replace('/', '-')}`;

        // ==========================================
        // NOVA MÁGICA 2: LENDO OS ATAQUES E RARIDADE (CORRIGIDO)
        // ==========================================
        let raridade = 'Desconhecida';
        let descricao = 'Texto não encontrado';

        try {
            const caixaDeInformacoes = pageCarta.locator('text=Raridade').locator('..').first();
            
            if (await caixaDeInformacoes.count() > 0) {
                const textoCompleto = await caixaDeInformacoes.innerText();
                descricao = textoCompleto.trim();

                // Divide o texto linha por linha, limpando os espaços
                const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(l => l !== '');
                
                // Percorre as linhas. Se achar "Raridade", pega o texto da linha seguinte!
                for (let j = 0; j < linhas.length; j++) {
                    if (linhas[j].toLowerCase() === 'raridade') {
                        raridade = linhas[j + 1]; // Pega a linha de baixo
                        break;
                    }
                }
            }
        } catch (err) {
            console.log(`   ⚠️ Aviso: Estrutura de texto diferente do padrão.`);
        }

        console.log(`   Nome: ${nomeCarta} | Raridade: ${raridade}`);
        console.log(`   Ataques/Regras extraídas: ${descricao.substring(0, 50)}... (truncado para leitura)`);

        const pacoteDeDados = {
            id_oficial: id_oficial,
            numero: numeroCarta,
            raridade: raridade,
            colecao: colecaoNome,
            language: 'PORTUGUESE_BRAZIL',
            nome: nomeCarta,
            descricao: descricao,
            url_imagem: url_imagem
        };

        try {
            const resposta = await fetch('http://localhost:3000/cartas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pacoteDeDados)
            });

            if (resposta.status === 201) {
                console.log(`   ✅ SUCESSO: Carta rica em detalhes salva!`);
            } else {
                console.log(`   ⚠️ AVISO: A API retornou status ${resposta.status}`);
            }
        } catch (erroDeConexao) {
            console.log(`   ❌ ERRO: Não foi possível conectar à API.`);
        }

        await pageCarta.close();
    }

    console.log(`\n🏆 Teste de Leitura Concluído!`);

  } catch (erro) {
    console.error('❌ Erro durante a execução do robô:', erro);
  } finally {
    console.log('🤖 Fechando o navegador...');
    await browser.close();
  }
}

iniciarScraper();