const DisparadorWhatsApp = require("./disparador");

/**
 * Demonstração da verificação de existência no WhatsApp
 * ATENÇÃO: Este é apenas um exemplo. Para testar, você precisa estar conectado ao WhatsApp.
 */
async function demonstrarVerificacao() {
  console.log("🧪 DEMONSTRAÇÃO: VERIFICAÇÃO DE EXISTÊNCIA NO WHATSAPP");
  console.log("=======================================================\n");

  // Configuração básica
  const config = {
    planilhaPath: "./contatos.xlsx",
    mensagemPadrao: "Teste de verificação",
    minTempoEntreEnvios: 5000,
    maxTempoEntreEnvios: 10000,
    minTempoPausaExtra: 30000,
    maxTempoPausaExtra: 60000,
    enviosParaPausaMin: 5,
    enviosParaPausaMax: 8,
  };

  const disparador = new DisparadorWhatsApp(config);

  // Números de exemplo para demonstração
  const numerosTeste = [
    { nome: "Teste SP (válido)", telefone: "5511999887766@c.us" },
    { nome: "Teste RJ (válido)", telefone: "5521988776655@c.us" },
    { nome: "Teste SC (válido)", telefone: "554599887766@c.us" },
    { nome: "Teste Inexistente", telefone: "5511111111111@c.us" },
    { nome: "Teste Formato Antigo SP", telefone: "551199887766@c.us" }, // Sem 9º dígito
    { nome: "Teste Formato Antigo SC", telefone: "5545999887766@c.us" }, // Com 9º dígito desnecessário
  ];

  console.log("📋 Números que serão testados:");
  numerosTeste.forEach((contato, index) => {
    console.log(`   ${index + 1}. ${contato.nome}: ${contato.telefone}`);
  });
  console.log("");

  console.log("⚠️ NOTA IMPORTANTE:");
  console.log("   Para funcionar, você precisa:");
  console.log("   1. Estar conectado ao WhatsApp (escanear QR code)");
  console.log("   2. Ter uma conexão estável com a internet");
  console.log("   3. Os números de teste devem existir no WhatsApp");
  console.log("");

  console.log("🔍 FUNCIONAMENTO DA VERIFICAÇÃO:");
  console.log("   1. Testa o número original primeiro");
  console.log("   2. Se não existir, gera variações (com/sem 9º dígito)");
  console.log("   3. Testa cada variação até encontrar uma válida");
  console.log("   4. Retorna o número correto ou null se não encontrar");
  console.log("");

  console.log("📱 EXEMPLO DE VARIAÇÕES GERADAS:");
  console.log("   Número original: 5511999887766");
  console.log("   Variações testadas:");
  console.log("   → 551199887766  (remove 9º dígito)");
  console.log("   → 5511999887766 (mantém original)");
  console.log("");
  console.log("   Número original: 554599887766");
  console.log("   Variações testadas:");
  console.log("   → 5545999887766 (adiciona 9º dígito)");
  console.log("   → 554599887766  (mantém original)");
  console.log("");

  // Simular verificação (sem conexão real)
  console.log("💡 EXEMPLO DE EXECUÇÃO (simulado):");

  for (const contato of numerosTeste) {
    console.log(`\n🔍 Verificando: ${contato.nome}`);

    // Extrair número limpo
    const numeroLimpo = contato.telefone.replace(/@c\.us$/, "");
    console.log(`   Número original: ${numeroLimpo}`);

    // Gerar variações usando a lógica do disparador
    const variacoes = gerarVariacoesExemplo(numeroLimpo);

    if (variacoes.length > 0) {
      console.log(`   Variações a testar:`);
      variacoes.forEach((variacao, index) => {
        console.log(`   ${index + 1}. ${variacao}`);
      });
    } else {
      console.log(`   Nenhuma variação adicional gerada`);
    }

    // Simular resultado
    const existe = !contato.nome.includes("Inexistente");
    if (existe) {
      console.log(`   ✅ Contato encontrado no WhatsApp`);
    } else {
      console.log(
        `   ❌ Contato não encontrado após testar todas as variações`
      );
    }
  }

  console.log("\n🚀 PARA USAR EM PRODUÇÃO:");
  console.log("   1. Conecte-se ao WhatsApp primeiro: npm start");
  console.log("   2. O sistema verificará automaticamente cada contato");
  console.log("   3. Só enviará mensagens para números que existem");
  console.log("   4. Atualizará automaticamente números com formato incorreto");
  console.log("");

  console.log("⚡ BENEFÍCIOS:");
  console.log("   ✅ Reduz falhas de envio");
  console.log("   ✅ Encontra números com formato incorreto");
  console.log("   ✅ Economiza tempo e recursos");
  console.log("   ✅ Melhora taxa de entrega");
}

/**
 * Versão simplificada da geração de variações para demonstração
 */
function gerarVariacoesExemplo(numeroOriginal) {
  const variacoes = [];
  const digits = numeroOriginal.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.substring(2, 4);
    const numero = digits.substring(4);

    const DDDneedsAnExtraNine = [
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19",
      "21",
      "22",
      "24",
      "27",
      "28",
    ];

    if (DDDneedsAnExtraNine.includes(ddd)) {
      if (numero.length === 9 && numero.startsWith("9")) {
        variacoes.push(`55${ddd}${numero.substring(1)}`);
      } else if (numero.length === 8) {
        variacoes.push(`55${ddd}9${numero}`);
      }
    } else {
      if (numero.length === 9 && numero.startsWith("9")) {
        variacoes.push(`55${ddd}${numero.substring(1)}`);
      } else if (numero.length === 8) {
        variacoes.push(`55${ddd}9${numero}`);
      }
    }
  }

  return variacoes.filter((v) => v !== digits);
}

// Executar demonstração se o arquivo for chamado diretamente
if (require.main === module) {
  demonstrarVerificacao().catch(console.error);
}

module.exports = { demonstrarVerificacao };
