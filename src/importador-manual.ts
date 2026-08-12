import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function iniciarInjecaoManual(nomeColecao: string) {
    console.log(`\n🚀 Iniciando Injeção Manual de Dados para a coleção: ${nomeColecao}...`);

    try {
        // 1. Lê o ficheiro onde você colou os dados
        const caminhoArquivo = path.join(process.cwd(), 'dados-manuais.json');
        
        if (!fs.existsSync(caminhoArquivo)) {
            throw new Error("O ficheiro 'dados-manuais.json' não foi encontrado na raiz do projeto!");
        }

        const conteudoBase = fs.readFileSync(caminhoArquivo, 'utf-8');
        let dadosBrutos = JSON.parse(conteudoBase);

        // 2. Garante que é uma lista (array), mesmo se você tiver colado só uma carta
        if (!Array.isArray(dadosBrutos)) {
            dadosBrutos = [dadosBrutos];
        }

        console.log(`📦 Encontrados ${dadosBrutos.length} registos no ficheiro. Processando...`);

        // 3. Processa e envia para a sua API local (Porta 3000)
        let sucesso = 0;
        let contador = 1;

        for (const item of dadosBrutos) {
            // O Scrydex às vezes coloca os dados dentro de "data"
            const carta = item.data ? item.data : item;

            if (!carta.id || !carta.name) {
                console.log(`   ⚠️ Registo ${contador} ignorado (formato inválido ou incompleto).`);
                contador++;
                continue;
            }

            // Gera os seus IDs Universais
            const nomeSetSlug = nomeColecao.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            // Extrai o número da carta pelo ID oficial deles (ex: 'base1-4' -> '4')
            const numeroCartaExtraido = carta.id.split('-').pop() || String(contador);
            const id_global = `${nomeSetSlug}-${numeroCartaExtraido}`;
            
            // Formata os ataques
            let descricaoAtaques = 'Nenhum ataque registrado.';
            if (carta.attacks && carta.attacks.length > 0) {
                descricaoAtaques = carta.attacks.map((atk: any) => `${atk.name} (${atk.damage || '0'}) - ${atk.text || ''}`).join(' | ');
            }

            const urlImagem = carta.image_url || carta.image || `https://images.scrydex.com/pokemon/${carta.id}/image`;

            const pacoteDeDados = {
                id_oficial: carta.id,
                id_global: id_global,
                numero: `${numeroCartaExtraido}/???`, // Como é manual, colocamos ??? no total
                raridade: carta.rarity || 'Comum',
                colecao: nomeColecao,
                language: 'ENGLISH',
                nome: carta.name,
                descricao: descricaoAtaques,
                url_imagem: urlImagem
            };

            // Injeta no seu Banco de Dados
            try {
                const resLocal = await fetch('http://localhost:3000/cartas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pacoteDeDados)
                });

                if (resLocal.status === 201) {
                    console.log(`   ✅ Guardado: ${carta.name} (${carta.id}) -> ID Global: ${id_global}`);
                    sucesso++;
                } else {
                    console.log(`   ❌ A sua API rejeitou a carta ${carta.name}. Status: ${resLocal.status}`);
                }
            } catch (err) {
                console.log(`   ❌ Erro de ligação à sua API. O 'npm run dev' está ligado?`);
            }
            contador++;
        }

        console.log(`\n🏆 Injeção concluída! ${sucesso} cartas foram guardadas com sucesso no seu banco de dados.`);

    } catch (erro: any) {
        console.error('\n❌ Erro Fatal na Injeção Manual:', erro.message);
        console.log('💡 Dica: Verifique se o JSON que colou no ficheiro está bem formatado.');
    }
}

// Menu Interativo
rl.question('\n🔮 Qual é o NOME da coleção destes dados? (Ex: Base, Obsidian Flames): ', (resposta) => {
    const colecaoEscolhida = resposta.trim();
    
    if (colecaoEscolhida) {
        iniciarInjecaoManual(colecaoEscolhida).then(() => rl.close());
    } else {
        console.log('❌ Operação cancelada. Nome não introduzido.');
        rl.close();
    }
});