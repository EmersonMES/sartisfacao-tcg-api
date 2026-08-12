import fs from 'fs';

async function aplicarCorrecoes() {
    console.log('🩺 Iniciando Importador Cirúrgico...');
    
    try {
        const dados = JSON.parse(fs.readFileSync('correcoes.json', 'utf-8'));
        let sucessos = 0;

        for (const correcao of dados) {
            const res = await fetch('http://localhost:3000/cartas/correcao', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(correcao)
            });

            const respostaServidor = await res.json();
            if (res.ok) {
                console.log(`✅ ${respostaServidor.msg}`);
                sucessos++;
            } else {
                console.log(`❌ Falha na carta ${correcao.id_oficial}: ${respostaServidor.erro}`);
            }
        }
        console.log(`\n🏆 Operação concluída. ${sucessos} cartas corrigidas.`);
    } catch (e) {
        console.log('❌ Erro: Não foi possível ler o arquivo correcoes.json.');
    }
}

aplicarCorrecoes();