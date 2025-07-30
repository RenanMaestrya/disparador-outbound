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

class NormalizadorTelefone {
  static normalizar(raw) {
    if (!raw || typeof raw !== "string") {
      console.log(`⚠️ Telefone inválido: ${raw}`);
      return null;
    }

    // Remover sufixo do WhatsApp se existir
    raw = raw.replace(/@c\.us$/, "").replace(/@s\.whatsapp\.net$/, "");

    // Extrair apenas dígitos
    const digits = raw.replace(/\D/g, "");

    let ddd = "",
      number = "";

    // Analisar diferentes formatos
    if (digits.startsWith("55") && digits.length >= 12) {
      // Formato: 55DDNNNNNNNNN (com código do país)
      ddd = digits.substring(2, 4);
      number = digits.substring(4);
    } else if (digits.length === 11 || digits.length === 10) {
      // Formato: DDNNNNNNNNN ou DDNNNNNNNN
      ddd = digits.substring(0, 2);
      number = digits.substring(2);
    } else {
      console.log(
        `⚠️ Formato de telefone não reconhecido: ${raw} (${digits.length} dígitos)`
      );
      return null;
    }

    // Validar DDD brasileiro
    if (!this.isValidDDD(ddd)) {
      console.log(`⚠️ DDD inválido: ${ddd} para telefone ${raw}`);
      return null;
    }

    // Aplicar regras específicas por DDD
    if (
      !DDDneedsAnExtraNine.includes(ddd) &&
      number.length === 9 &&
      number.startsWith("9")
    ) {
      // DDDs que não precisam do 9 extra, remover se presente
      number = number.substring(1);
    }

    if (DDDneedsAnExtraNine.includes(ddd) && number.length === 8) {
      // DDDs que precisam do 9 extra, adicionar se ausente
      number = "9" + number;
    }

    // Validar tamanho final do número
    const expectedLength = DDDneedsAnExtraNine.includes(ddd) ? 9 : 8;
    if (number.length !== expectedLength) {
      console.log(
        `⚠️ Número com tamanho incorreto: ${number} (esperado ${expectedLength} dígitos) para DDD ${ddd}`
      );
      return null;
    }

    const normalized = `55${ddd}${number}@c.us`;

    // Log da normalização se houve mudança
    const originalFormatted = `${raw}@c.us`;
    if (normalized !== originalFormatted) {
      console.log(`📱 Telefone normalizado: ${raw} → ${normalized}`);
    }

    return normalized;
  }

  static isValidDDD(ddd) {
    const validDDDs = [
      // Região Sudeste
      "11",
      "12",
      "13",
      "14",
      "15",
      "16",
      "17",
      "18",
      "19", // São Paulo
      "21",
      "22",
      "24", // Rio de Janeiro
      "27",
      "28", // Espírito Santo
      "31",
      "32",
      "33",
      "34",
      "35",
      "37",
      "38", // Minas Gerais

      // Região Sul
      "41",
      "42",
      "43",
      "44",
      "45",
      "46", // Paraná
      "47",
      "48",
      "49", // Santa Catarina
      "51",
      "53",
      "54",
      "55", // Rio Grande do Sul

      // Região Nordeste
      "71",
      "73",
      "74",
      "75",
      "77", // Bahia
      "79", // Sergipe
      "81",
      "87", // Pernambuco
      "82", // Alagoas
      "83", // Paraíba
      "84", // Rio Grande do Norte
      "85",
      "88", // Ceará
      "86",
      "89", // Piauí
      "98",
      "99", // Maranhão

      // Região Norte
      "61", // Distrito Federal/Goiás
      "62",
      "64", // Goiás
      "63", // Tocantins
      "65",
      "66", // Mato Grosso
      "67", // Mato Grosso do Sul
      "68", // Acre
      "69", // Rondônia
      "91",
      "93",
      "94", // Pará
      "92",
      "97", // Amazonas
      "95", // Roraima
      "96", // Amapá
    ];

    return validDDDs.includes(ddd);
  }

  static validarEFormatarLista(contatos) {
    const contatosValidos = [];
    const contatosInvalidos = [];

    contatos.forEach((contato) => {
      const telefoneNormalizado = this.normalizar(contato.telefone);

      if (telefoneNormalizado) {
        contatosValidos.push({
          ...contato,
          telefone: telefoneNormalizado,
          telefoneOriginal: contato.telefone,
        });
      } else {
        contatosInvalidos.push(contato);
      }
    });

    // Relatório de validação
    if (contatosInvalidos.length > 0) {
      console.log(
        `\n⚠️ ${contatosInvalidos.length} contatos com telefones inválidos:`
      );
      contatosInvalidos.forEach((contato) => {
        console.log(`   • ${contato.nome}: ${contato.telefone}`);
      });
      console.log("");
    }

    console.log(`✅ ${contatosValidos.length} contatos com telefones válidos`);

    return {
      validos: contatosValidos,
      invalidos: contatosInvalidos,
    };
  }
}

module.exports = NormalizadorTelefone;
