const PlanilhaManager = require("./planilha");

// Função para testar a normalização de números
function testarNormalizacao() {
  console.log("🧪 TESTE DO NORMALIZADOR DE TELEFONES");
  console.log("=====================================\n");

  const planilha = new PlanilhaManager("./test");

  const numerosTeste = [
    // Números com DDDs que precisam do 9º dígito
    "11999887766", // SP - 9 dígitos ✅
    "1199887766", // SP - 8 dígitos, deve adicionar 9
    "5511999887766", // SP - com código do país ✅
    "21988776655", // RJ - 9 dígitos ✅
    "2188776655", // RJ - 8 dígitos, deve adicionar 9

    // Números com DDDs que NÃO precisam do 9º dígito
    "4599887766", // SC - 8 dígitos ✅
    "45999887766", // SC - 9 dígitos, deve remover 9
    "5545999887766", // SC - com código, deve remover 9
    "6299887766", // GO - 8 dígitos ✅

    // Números inválidos
    "123456", // Muito curto
    "999999999999999", // Muito longo
    "0011999887766", // DDD inválido (00)
    "99999887766", // DDD inválido (99)
    "", // Vazio
    null, // Null

    // Números com formatação
    "(11) 99988-7766",
    "+55 11 99988-7766",
    "11 9 9988-7766",
    "011-99988-7766",
  ];

  let validos = 0;
  let invalidos = 0;

  numerosTeste.forEach((numero) => {
    console.log(`\n📱 Testando: "${numero}"`);
    const resultado = planilha.formatarTelefone(numero);
    if (resultado) {
      console.log(`✅ Resultado: ${resultado}`);
      validos++;
    } else {
      console.log(`❌ Número inválido/rejeitado`);
      invalidos++;
    }
  });

  console.log("\n📊 ESTATÍSTICAS:");
  console.log("=====================================");
  console.log(`✅ Números válidos: ${validos}`);
  console.log(`❌ Números rejeitados: ${invalidos}`);
  console.log(`📱 Total testados: ${numerosTeste.length}`);

  console.log("\n📋 RESUMO DOS DDDs:");
  console.log("=====================================");
  console.log("✅ DDDs que PRECISAM do 9º dígito:");
  console.log("   SP: 11-19 (São Paulo e região)");
  console.log("   RJ: 21, 22, 24 (Rio de Janeiro e região)");
  console.log("   ES: 27, 28 (Espírito Santo)");
  console.log("");
  console.log("❌ DDDs que NÃO precisam do 9º dígito:");
  console.log("   Todos os outros (31-89)");
  console.log("   Exemplo: MG, PR, SC, RS, GO, etc.");
}

// Executar teste se o arquivo for chamado diretamente
if (require.main === module) {
  testarNormalizacao();
}

module.exports = { testarNormalizacao };
