const fs = require("fs");
const path = require("path");

class ControleEnvios {
  constructor() {
    this.arquivoControle = "./envios-realizados.json";
    this.enviosRealizados = this.carregarEnvios();
  }

  carregarEnvios() {
    try {
      if (fs.existsSync(this.arquivoControle)) {
        const dados = fs.readFileSync(this.arquivoControle, "utf8");
        return JSON.parse(dados);
      }
    } catch (error) {
      console.log("⚠️ Erro ao carregar controle de envios:", error.message);
    }
    return {};
  }

  salvarEnvios() {
    try {
      fs.writeFileSync(
        this.arquivoControle,
        JSON.stringify(this.enviosRealizados, null, 2)
      );
    } catch (error) {
      console.log("❌ Erro ao salvar controle de envios:", error.message);
    }
  }

  jaFoiEnviado(telefone) {
    return this.enviosRealizados.hasOwnProperty(telefone);
  }

  marcarComoEnviado(telefone, nome, mensagem) {
    this.enviosRealizados[telefone] = {
      nome: nome,
      dataEnvio: new Date().toISOString(),
      mensagemEnviada: mensagem.substring(0, 100), // Salvar apenas os primeiros 100 caracteres
    };
    this.salvarEnvios();
  }

  filtrarContatosNaoEnviados(contatos) {
    const contatosNaoEnviados = contatos.filter(
      (contato) => !this.jaFoiEnviado(contato.telefone)
    );
    const contatosJaEnviados = contatos.filter((contato) =>
      this.jaFoiEnviado(contato.telefone)
    );

    if (contatosJaEnviados.length > 0) {
      console.log(
        `⏭️  ${contatosJaEnviados.length} contatos ignorados (já receberam mensagens):`
      );
      contatosJaEnviados.forEach((contato) => {
        const envio = this.enviosRealizados[contato.telefone];
        const dataFormatada = new Date(envio.dataEnvio).toLocaleString("pt-BR");
        console.log(`   • ${contato.nome} - Enviado em ${dataFormatada}`);
      });
      console.log("");
    }

    return contatosNaoEnviados;
  }

  obterEstatisticas() {
    const totalEnviados = Object.keys(this.enviosRealizados).length;
    return {
      totalEnviados,
      ultimoEnvio: this.obterUltimoEnvio(),
    };
  }

  obterUltimoEnvio() {
    const envios = Object.values(this.enviosRealizados);
    if (envios.length === 0) return null;

    const ultimoEnvio = envios.reduce((ultimo, atual) => {
      return new Date(atual.dataEnvio) > new Date(ultimo.dataEnvio)
        ? atual
        : ultimo;
    });

    return {
      nome: ultimoEnvio.nome,
      data: new Date(ultimoEnvio.dataEnvio).toLocaleString("pt-BR"),
    };
  }

  limparHistorico() {
    this.enviosRealizados = {};
    this.salvarEnvios();
    console.log("🧹 Histórico de envios limpo com sucesso!");
  }

  mostrarHistorico() {
    const stats = this.obterEstatisticas();
    console.log(`📊 Estatísticas de envios:`);
    console.log(`   Total enviado: ${stats.totalEnviados} mensagens`);

    if (stats.ultimoEnvio) {
      console.log(
        `   Último envio: ${stats.ultimoEnvio.nome} em ${stats.ultimoEnvio.data}`
      );
    }

    if (stats.totalEnviados > 0) {
      console.log(`   Arquivo de controle: ${this.arquivoControle}`);
    }
    console.log("");
  }
}

module.exports = ControleEnvios;
