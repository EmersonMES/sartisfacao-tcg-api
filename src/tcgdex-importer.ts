import readline from 'readline';
import fs from 'fs';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function importarDoTCGDex(idColecao: string, idioma: string) {
    console.log(`\n🚀 Conectando ao TCGDex [Idioma: ${idioma.toUpperCase()}] para a coleção: ${idColecao}...`);

    try {
        const respostaSet = await fetch(`https://api.tcgdex.net/v2/${idioma}/sets/${idColecao}`);
        
        if (!respostaSet.ok) {
            console.log(`   ❌ AVISO: Coleção '${idColecao}' não encontrada no idioma '${idioma.toUpperCase()}'. Pulando para a próxima...`);
            return; // Sai desta função e permite que o robô continue para a próxima coleção da lista
        }

        const dadosSet = await respostaSet.json();
        const totalCartas = dadosSet.cards.length;
        const nomeColecao = dadosSet.name;

        // NOVA VARIÁVEL DE AUDITORIA
        const resultadoAuditoria = {
            novasCartas: 0,
            novosIdiomas: 0,
            ignoradas: 0,
            logDetalhado: [] as string[]
        };

        console.log(`✅ Coleção: ${nomeColecao} (${totalCartas} cartas). Varrimento iniciado...`);

        let sucesso = 0;

        for (let i = 0; i < totalCartas; i++) {
            const cartaResumo = dadosSet.cards[i];
            
            try {
                const resCarta = await fetch(`https://api.tcgdex.net/v2/${idioma}/cards/${cartaResumo.id}`);
                const carta = await resCarta.json();

                const nomeSetSlug = nomeColecao.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                const id_global = `${nomeSetSlug}-${carta.localId}`;

                let descricaoAtaques = 'Nenhum ataque registrado.';
                if (carta.attacks && carta.attacks.length > 0) {
                    descricaoAtaques = carta.attacks.map((atk: any) => 
                        `${atk.name} (${atk.damage || '0'}) - ${atk.effect || ''}`
                    ).join(' | ');
                }

                const urlImagem = carta.image ? `${carta.image}/high.webp` : '';

                const pacoteDeDados = {
                    id_oficial: carta.id,
                    id_global: id_global,
                    numero: `${carta.localId}/${dadosSet.cardCount.official}`,
                    raridade: carta.rarity || 'Comum',
                    colecao: nomeColecao,
                    language: idioma.toUpperCase(),
                    nome: carta.name,
                    descricao: descricaoAtaques,
                    url_imagem: urlImagem
                };

                const resLocal = await fetch('http://localhost:3000/cartas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pacoteDeDados)
                });

                if (resLocal.status === 409) {
                    // Retirámos o 'break;'. Agora ele apenas regista e continua!
                    resultadoAuditoria.ignoradas++; 
                } 
                else if (resLocal.status === 201) {
                    console.log(`   ✨ NOVA CARTA: ${carta.name}`);
                    resultadoAuditoria.novasCartas++;
                    resultadoAuditoria.logDetalhado.push(`[NOVA CARTA] ${carta.id} (${idioma.toUpperCase()})`);
                } 
                else if (resLocal.status === 200) {
                    console.log(`   🌍 NOVO IDIOMA: ${carta.name}`);
                    resultadoAuditoria.novosIdiomas++;
                    resultadoAuditoria.logDetalhado.push(`[NOVO IDIOMA] ${carta.id} (${idioma.toUpperCase()})`);
                } 
                else {
                    console.log(`   ❌ Servidor recusou a carta ${carta.name}`);
                }

            } catch (errCarta) {
                console.log(`   ⚠️ Falha técnica na carta ${cartaResumo.id}. Avançando...`);
            }
        }

        if (sucesso > 0) {
            console.log(`\n🏆 Set '${nomeColecao}' concluído! ${sucesso} novas traduções guardadas.`);
        } else {
            console.log(`\n🏁 Verificação de '${nomeColecao}' concluída. Nenhuma alteração nova.`);
        }

    } catch (erro: any) {
        console.error(`\n❌ Erro Fatal no Set ${idColecao}:`, erro.message);
    }
}

// O Novo Menu de Lote (Batch)
rl.question('\n🔗 Digite os IDs dos Sets separados por VÍRGULA (Ex: base1, base2, base3, gym1): ', (idsEscolhidos) => {
    const inputSets = idsEscolhidos.trim().toLowerCase();
    
    if (!inputSets) {
        console.log('❌ Operação cancelada.');
        return rl.close();
    }

    // Transforma o texto "base1, base2" numa lista limpa ['base1', 'base2']
    const listaSets = inputSets.split(',').map(id => id.trim()).filter(id => id.length > 0);

    rl.question('🌍 Qual é a sigla do IDIOMA que deseja anexar a esses sets? (Ex: pt, es, ja, fr): ', async (langEscolhida) => {
        const idioma = langEscolhida.trim().toLowerCase();
        
        if (!idioma) {
            console.log('❌ Operação cancelada.');
            return rl.close();
        }

        console.log(`\n🚀 INICIANDO IMPORTAÇÃO EM LOTE DE ${listaSets.length} COLEÇÕES...`);

        for (const idSet of listaSets) {
            await importarDoTCGDex(idSet, idioma);
            console.log('\n---------------------------------------------------');
        }

        // ==========================================
        // GERAÇÃO DO RELATÓRIO DE AUDITORIA
        // ==========================================
        const dataHoje = new Date().toISOString().split('T')[0];
        const nomeArquivoLog = `Relatorio-Auditoria-${dataHoje}.txt`;
        
        const relatorioTexto = `
            ==============================================
            RELATÓRIO DE AUDITORIA TCGDEX - ${dataHoje}
            ==============================================
            Este log regista as alterações detetadas e 
            injetadas no seu banco de dados local.
            
            Se houveram novas cartas adicionadas pelo TCGDex,
            elas estarão listadas abaixo.
            ==============================================
                    `;
        
        // Escreve o relatório no seu computador
        fs.writeFileSync(nomeArquivoLog, relatorioTexto, { flag: 'a' });

        console.log(`\n🎉 IMPORTAÇÃO CONCLUÍDA! Foi gerado um ficheiro '${nomeArquivoLog}' na sua pasta com os detalhes!`);
        rl.close();
    });
});