import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function iniciarInjecaoEmMassa(colecaoAlvo: string) {
    console.log(`\n🚀 Iniciando Injeção em Massa da coleção: ${colecaoAlvo.toUpperCase()}...`);

    try {
        // O Disfarce de Navegador:
        const resposta = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${colecaoAlvo}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (!resposta.ok) throw new Error(`Falha ao contactar a API Mundial. Status: ${resposta.status}`);

        const dados = await resposta.json();
        const cartas = dados.data;

        if (!cartas || cartas.length === 0) {
            console.log(`❌ Nenhuma carta encontrada para a sigla '${colecaoAlvo}'. Verifique se escreveu corretamente.`);
            return;
        }

        console.log(`📦 ${cartas.length} cartas encontradas. Começando a injeção...`);

        for (const carta of cartas) {
            const numeroLimpo = carta.number || '0';
            const totalLimpo = carta.set?.printedTotal || '0';
            const nomeSetEn = carta.set?.name || 'Coleção Desconhecida';
            const raridade = carta.rarity || 'Comum';
            
            const id_global = `${nomeSetEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${numeroLimpo}`;
            
            let descricaoAtaques = 'Nenhum ataque registrado.';
            if (carta.attacks && carta.attacks.length > 0) {
                descricaoAtaques = carta.attacks.map((atk: any) => `${atk.name} (${atk.damage}) - ${atk.text}`).join(' | ');
            }

            const pacoteDeDados = {
                id_oficial: carta.id,
                id_global: id_global,
                numero: `${numeroLimpo}/${totalLimpo}`,
                raridade: raridade,
                colecao: nomeSetEn,
                language: 'ENGLISH', 
                nome: carta.name,
                descricao: descricaoAtaques,
                url_imagem: carta.images.large
            };

            try {
                const res = await fetch('http://localhost:3000/cartas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pacoteDeDados)
                });

                if (res.status === 201) {
                    console.log(`   ✅ SUCESSO: ${carta.name} (${carta.id}) injetada!`);
                }
            } catch (err) {
                console.log(`   ❌ ERRO ao salvar ${carta.name}. O servidor está ligado?`);
            }
            
            await new Promise(r => setTimeout(r, 100)); 
        }
        console.log(`\n🏆 Injeção da coleção ${colecaoAlvo.toUpperCase()} concluída com sucesso!`);
    } catch (erro) {
        console.error('❌ Erro Fatal no Dumper:', erro);
    }
}

rl.question('\n🔮 Digite a sigla da coleção oficial (ex: base1, sv4, swsh1): ', (resposta) => {
    const colecaoEscolhida = resposta.trim().toLowerCase();
    
    if (colecaoEscolhida) {
        iniciarInjecaoEmMassa(colecaoEscolhida).then(() => rl.close());
    } else {
        console.log('❌ Operação cancelada. Nenhuma sigla introduzida.');
        rl.close();
    }
});