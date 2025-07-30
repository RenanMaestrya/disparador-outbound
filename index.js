const fs = require("fs");
const DisparadorWhatsApp = require("./disparador");

// Carregar configurações
function carregarConfig() {
  const configPath = "./config.env";

  if (!fs.existsSync(configPath)) {
    console.log(
      "📝 Arquivo config.env não encontrado. Criando com configurações padrão..."
    );
    const configPadrao = `# Configurações da aplicação
PLANILHA_PATH=./contatos.xlsx
MENSAGEM_PADRAO=Olá! Esta é uma mensagem de teste do disparador automático.
MIN_TEMPO_ENTRE_ENVIOS=30000
MAX_TEMPO_ENTRE_ENVIOS=120000
MIN_TEMPO_PAUSA_EXTRA=300000
MAX_TEMPO_PAUSA_EXTRA=600000
ENVIOS_PARA_PAUSA_MIN=10
ENVIOS_PARA_PAUSA_MAX=14`;

    fs.writeFileSync(configPath, configPadrao);
  }

  const configContent = fs.readFileSync(configPath, "utf8");
  const config = {};

  configContent.split("\n").forEach((line) => {
    if (line && !line.startsWith("#")) {
      const [key, value] = line.split("=");
      if (key && value) {
        config[key.trim()] = value.trim();
      }
    }
  });

  return {
    planilhaPath: config.PLANILHA_PATH || "./contatos.xlsx",
    mensagemPadrao:
      config.MENSAGEM_PADRAO || "Olá! Esta é uma mensagem de teste.",
    minTempoEntreEnvios: parseInt(config.MIN_TEMPO_ENTRE_ENVIOS) || 30000,
    maxTempoEntreEnvios: parseInt(config.MAX_TEMPO_ENTRE_ENVIOS) || 120000,
    minTempoPausaExtra: parseInt(config.MIN_TEMPO_PAUSA_EXTRA) || 300000,
    maxTempoPausaExtra: parseInt(config.MAX_TEMPO_PAUSA_EXTRA) || 600000,
    enviosParaPausaMin: parseInt(config.ENVIOS_PARA_PAUSA_MIN) || 10,
    enviosParaPausaMax: parseInt(config.ENVIOS_PARA_PAUSA_MAX) || 14,
  };
}

// Função principal
async function main() {
  try {
    console.log("🎯 DISPARADOR WHATSAPP - OUTBOUND");
    console.log("=====================================\n");

    // Carregar configurações
    const config = carregarConfig();
    console.log("📋 Configurações carregadas:");
    console.log(`   Planilha: ${config.planilhaPath}`);
    console.log(
      `   Tempo entre envios: ${config.minTempoEntreEnvios / 1000}s - ${
        config.maxTempoEntreEnvios / 1000
      }s`
    );
    console.log(
      `   Pausa extra: ${config.minTempoPausaExtra / 1000}s - ${
        config.maxTempoPausaExtra / 1000
      }s`
    );
    console.log(
      `   Pausa a cada: ${config.enviosParaPausaMin}-${config.enviosParaPausaMax} envios`
    );
    console.log("");

    // Verificar argumentos da linha de comando
    const args = process.argv.slice(2);
    if (args.includes("--clear-auth")) {
      const disparador = new DisparadorWhatsApp(config);
      disparador.limparAuth();
      console.log("✅ Autenticação limpa com sucesso!");
      return;
    }

    if (args.includes("--clear-history")) {
      const disparador = new DisparadorWhatsApp(config);
      await disparador.controleEnvios.inicializar();
      await disparador.limparHistorico();
      return;
    }

    if (args.includes("--show-history")) {
      const disparador = new DisparadorWhatsApp(config);
      await disparador.controleEnvios.inicializar();
      await disparador.mostrarHistorico();
      return;
    }

    // Criar e inicializar disparador
    const disparador = new DisparadorWhatsApp(config);
    await disparador.inicializar();
  } catch (error) {
    console.error("❌ Erro na aplicação:", error.message);
    console.log("\n💡 Dicas:");
    console.log(
      "   - Certifique-se de que a planilha existe e tem o formato correto"
    );
    console.log(
      '   - Verifique se as colunas "Nome" e "Telefone" estão presentes'
    );
    console.log(
      "   - Use --clear-auth para limpar a autenticação se necessário"
    );
    console.log("   - Use --clear-history para limpar histórico de envios");
    console.log("   - Use --show-history para ver estatísticas de envios");
    process.exit(1);
  }
}

// Tratamento de sinais para encerramento gracioso
process.on("SIGINT", () => {
  console.log("\n🛑 Encerrando aplicação...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Encerrando aplicação...");
  process.exit(0);
});

// Executar aplicação
if (require.main === module) {
  main();
}
