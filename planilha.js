const ExcelJS = require("exceljs");
const fs = require("fs");

class PlanilhaManager {
  constructor(caminhoPlanilha) {
    this.caminhoPlanilha = caminhoPlanilha;
  }

  async lerContatos() {
    try {
      if (!fs.existsSync(this.caminhoPlanilha)) {
        throw new Error(`Planilha não encontrada: ${this.caminhoPlanilha}`);
      }

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.caminhoPlanilha);

      // Primeira aba: Contatos
      const worksheetContatos = workbook.getWorksheet(1);
      if (!worksheetContatos) {
        throw new Error("Nenhuma planilha encontrada no arquivo");
      }

      // Segunda aba: Mensagens (se existir)
      const worksheetMensagens = workbook.getWorksheet(2);

      // Terceira aba: Configurações (se existir)
      const worksheetConfig = workbook.getWorksheet(3);

      // Processar contatos
      const contatos = this.processarContatos(worksheetContatos);

      // Processar mensagens
      const mensagens = worksheetMensagens
        ? this.processarMensagens(worksheetMensagens)
        : [];

      // Processar configurações
      const configuracoes = worksheetConfig
        ? this.processarConfiguracoes(worksheetConfig)
        : {};

      console.log(`✅ ${contatos.length} contatos carregados da planilha`);
      if (mensagens.length > 0) {
        console.log(`✅ ${mensagens.length} mensagens carregadas da planilha`);
      }
      if (configuracoes.horarioInicio) {
        console.log(
          `⏰ Horário de início configurado: ${configuracoes.horarioInicio}`
        );
      }

      return { contatos, mensagens, configuracoes };
    } catch (error) {
      console.error("❌ Erro ao ler planilha:", error.message);
      throw error;
    }
  }

  processarContatos(worksheet) {
    const dados = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData = [];
      row.eachCell((cell, colNumber) => {
        rowData[colNumber - 1] = cell.value;
      });
      dados.push(rowData);
    });

    if (dados.length < 2) {
      throw new Error(
        "Planilha deve ter pelo menos um cabeçalho e uma linha de dados"
      );
    }

    // Pegar cabeçalhos (primeira linha)
    const cabecalhos = dados[0];

    // Encontrar índices das colunas
    const indiceNome = cabecalhos.findIndex(
      (h) => h && h.toString().toLowerCase().includes("nome")
    );
    const indiceTelefone = cabecalhos.findIndex(
      (h) =>
        (h && h.toString().toLowerCase().includes("telefone")) ||
        (h && h.toString().toLowerCase().includes("celular")) ||
        (h && h.toString().toLowerCase().includes("phone"))
    );

    if (indiceTelefone === -1) {
      throw new Error('Coluna "telefone" não encontrada na planilha');
    }

    // Processar dados (pular primeira linha que é cabeçalho)
    const contatos = [];
    let numerosInvalidos = 0;

    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      if (linha && linha[indiceTelefone]) {
        const telefone = this.formatarTelefone(
          linha[indiceTelefone].toString()
        );
        const nome = indiceNome !== -1 ? linha[indiceNome] : "Contato";

        // Só adicionar se o telefone foi normalizado com sucesso
        if (telefone) {
          contatos.push({
            nome: nome || "Contato",
            telefone: telefone,
          });
        } else {
          numerosInvalidos++;
          console.log(
            `❌ Contato ${nome || "sem nome"} ignorado (número inválido: ${
              linha[indiceTelefone]
            })`
          );
        }
      }
    }

    if (numerosInvalidos > 0) {
      console.log(
        `⚠️ ${numerosInvalidos} contatos ignorados por terem números inválidos`
      );
    }

    return contatos;
  }

  processarDataAgendamento(valor) {
    if (!valor) return null;

    try {
      // Se for um objeto Date do Excel
      if (valor instanceof Date) {
        return valor;
      }

      // Se for string, tentar parsear
      if (typeof valor === "string") {
        const data = new Date(valor);
        if (!isNaN(data.getTime())) {
          return data;
        }
      }

      // Se for número (serial date do Excel)
      if (typeof valor === "number") {
        // Excel usa 1900-01-01 como data base (com correção para bug do Excel)
        const excelEpoch = new Date(1900, 0, 1);
        const data = new Date(
          excelEpoch.getTime() + (valor - 2) * 24 * 60 * 60 * 1000
        );
        return data;
      }

      return null;
    } catch (error) {
      console.log("⚠️ Erro ao processar data de agendamento:", error.message);
      return null;
    }
  }

  processarMensagens(worksheet) {
    const mensagens = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Pular cabeçalho

      const mensagem = row.getCell(1).value;
      if (mensagem && mensagem.toString().trim()) {
        mensagens.push(mensagem.toString().trim());
      }
    });

    return mensagens;
  }

  processarConfiguracoes(worksheet) {
    const configuracoes = {};

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Pular cabeçalho

      const chave = row.getCell(1).value;
      const valor = row.getCell(2).value;

      if (chave && valor) {
        const chaveStr = chave.toString().toLowerCase().trim();
        const valorStr = valor.toString().trim();

        if (chaveStr.includes("horario") || chaveStr.includes("hora")) {
          configuracoes.horarioInicio = valorStr;
        }
      }
    });

    return configuracoes;
  }

  formatarTelefone(telefone) {
    // DDDs que precisam do nono dígito (capital e região metropolitana)
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

    if (!telefone || typeof telefone !== "string") {
      console.log("⚠️ Telefone inválido:", telefone);
      return null;
    }

    // Remove sufixo do WhatsApp se existir
    let raw = telefone.replace(/@(c\.us|s\.whatsapp\.net)$/, "");

    // Remove todos os caracteres não numéricos
    const digits = raw.replace(/\D/g, "");

    let ddd = "",
      number = "";

    // Processar números com código do país (55)
    if (digits.startsWith("55") && digits.length >= 12) {
      ddd = digits.substring(2, 4);
      number = digits.substring(4);
    }
    // Processar números sem código do país
    else if (digits.length === 11 || digits.length === 10) {
      ddd = digits.substring(0, 2);
      number = digits.substring(2);
    }
    // Número muito curto ou muito longo
    else {
      console.log(
        `⚠️ Número com formato inválido: ${telefone} (${digits.length} dígitos)`
      );
      return null;
    }

    // Validar DDD brasileiro (11-89, excluindo alguns não utilizados)
    const dddNum = parseInt(ddd);
    const dddsInvalidos = [
      20, 23, 25, 26, 29, 30, 36, 39, 40, 50, 52, 56, 57, 58, 59, 60, 70, 72,
      76, 78, 80, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
    ];

    if (dddNum < 11 || dddNum > 89 || dddsInvalidos.includes(dddNum)) {
      console.log(`⚠️ DDD inválido: ${ddd} no número ${telefone}`);
      return null;
    }

    // Remover 9 inicial desnecessário para DDDs que não precisam
    if (
      !DDDneedsAnExtraNine.includes(ddd) &&
      number.length === 9 &&
      number.startsWith("9")
    ) {
      number = number.substring(1);
    }

    // Adicionar 9 inicial para DDDs que precisam (celulares de 8 dígitos)
    if (DDDneedsAnExtraNine.includes(ddd) && number.length === 8) {
      number = "9" + number;
    }

    // Validar tamanho final do número
    const expectedLength = DDDneedsAnExtraNine.includes(ddd) ? 9 : 8;
    if (number.length !== expectedLength) {
      console.log(
        `⚠️ Número com tamanho incorreto para DDD ${ddd}: ${number} (esperado: ${expectedLength} dígitos)`
      );
      return null;
    }

    // Construir número final
    const numeroNormalizado = `55${ddd}${number}@c.us`;

    // Log apenas para debug (pode remover depois)
    if (numeroNormalizado !== `55${digits}@c.us`) {
      console.log(`📱 Número normalizado: ${telefone} → ${numeroNormalizado}`);
    }

    return numeroNormalizado;
  }

  async criarPlanilhaExemplo() {
    const workbook = new ExcelJS.Workbook();

    // Aba 1: Contatos
    const worksheetContatos = workbook.addWorksheet("Contatos");
    worksheetContatos.addRow(["Nome", "Telefone"]);
    worksheetContatos.addRow(["João Silva", "11999887766"]);
    worksheetContatos.addRow(["Maria Santos", "21988776655"]);
    worksheetContatos.addRow(["Pedro Costa", "31977665544"]);

    // Aba 2: Mensagens
    const worksheetMensagens = workbook.addWorksheet("Mensagens");
    worksheetMensagens.addRow(["Mensagem"]);
    worksheetMensagens.addRow(["Olá! Tudo bem? Esta é uma mensagem de teste."]);
    worksheetMensagens.addRow([
      "Oi! Como você está? Espero que esteja tudo bem!",
    ]);
    worksheetMensagens.addRow(["Olá! Que tal? Tenha um ótimo dia!"]);

    // Aba 3: Configurações
    const worksheetConfig = workbook.addWorksheet("Configurações");
    worksheetConfig.addRow(["Configuração", "Valor"]);
    worksheetConfig.addRow(["Horário de Início", "09:00"]);
    worksheetConfig.addRow(["", "(deixe vazio para envio imediato)"]);

    // Salvar arquivo
    await workbook.xlsx.writeFile(this.caminhoPlanilha);
    console.log(`✅ Planilha exemplo criada: ${this.caminhoPlanilha}`);
    console.log(`📋 Aba "Contatos": Nome e Telefone`);
    console.log(`💬 Aba "Mensagens": Lista de mensagens para envio aleatório`);
    console.log(`⏰ Aba "Configurações": Horário de início dos envios`);
  }
}

module.exports = PlanilhaManager;
