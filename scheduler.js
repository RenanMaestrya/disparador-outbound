const cron = require("node-cron");
const DatabaseManager = require("./database");

class Scheduler {
  constructor(disparador) {
    this.disparador = disparador;
    this.database = new DatabaseManager();
    this.cronJob = null;
    this.ativo = false;
  }

  async inicializar() {
    try {
      const conectado = await this.database.conectar();
      if (!conectado) {
        console.log("⚠️ Scheduler desabilitado - MySQL não disponível");
        return false;
      }

      console.log("📅 Scheduler inicializado com sucesso!");
      return true;
    } catch (error) {
      console.log("❌ Erro ao inicializar scheduler:", error.message);
      return false;
    }
  }

  iniciarMonitoramento() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Verificar envios pendentes a cada minuto
    this.cronJob = cron.schedule(
      "* * * * *",
      async () => {
        if (this.disparador.conectado) {
          await this.processarEnviosPendentes();
        }
      },
      {
        scheduled: false,
      }
    );

    this.cronJob.start();
    this.ativo = true;
    console.log(
      "⏰ Monitoramento de agendamentos iniciado (verifica a cada minuto)"
    );
  }

  pararMonitoramento() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.ativo = false;
      console.log("⏸️ Monitoramento de agendamentos pausado");
    }
  }

  async processarEnviosPendentes() {
    try {
      const enviosPendentes = await this.database.obterEnviosPendentes();

      if (enviosPendentes.length > 0) {
        console.log(
          `📅 Processando ${enviosPendentes.length} envios agendados...`
        );

        for (const envio of enviosPendentes) {
          await this.processarEnvio(envio);
        }
      }
    } catch (error) {
      console.log("❌ Erro ao processar envios pendentes:", error.message);
    }
  }

  async processarEnvio(envio) {
    try {
      console.log(`📤 Enviando mensagem agendada para ${envio.nome}...`);

      // Enviar a mensagem
      await this.disparador.sock.sendMessage(envio.telefone, {
        text: envio.mensagem,
      });

      // Marcar como enviado
      await this.database.marcarComoEnviado(envio.id);
      await this.database.adicionarAoHistorico(
        envio.telefone,
        envio.nome,
        envio.mensagem,
        true
      );

      console.log(`✅ Mensagem agendada enviada para ${envio.nome}`);
    } catch (error) {
      console.log(
        `❌ Erro ao enviar mensagem agendada para ${envio.nome}:`,
        error.message
      );

      // Marcar como erro
      await this.database.marcarComoErro(envio.id, error.message);
      await this.database.adicionarAoHistorico(
        envio.telefone,
        envio.nome,
        envio.mensagem,
        false,
        error.message
      );
    }
  }

  async agendarEnvio(telefone, nome, mensagem, dataAgendamento) {
    try {
      const id = await this.database.agendarEnvio(
        telefone,
        nome,
        mensagem,
        dataAgendamento
      );
      console.log(
        `📅 Envio agendado (ID: ${id}) para ${nome} em ${dataAgendamento.toLocaleString(
          "pt-BR"
        )}`
      );
      return id;
    } catch (error) {
      console.log("❌ Erro ao agendar envio:", error.message);
      throw error;
    }
  }

  async obterEstatisticas() {
    try {
      return await this.database.obterEstatisticas();
    } catch (error) {
      console.log("❌ Erro ao obter estatísticas:", error.message);
      return null;
    }
  }

  async limparHistorico() {
    try {
      await this.database.limparHistorico();
    } catch (error) {
      console.log("❌ Erro ao limpar histórico:", error.message);
    }
  }

  async jaFoiEnviado(telefone) {
    try {
      return await this.database.jaFoiEnviado(telefone);
    } catch (error) {
      console.log("❌ Erro ao verificar histórico:", error.message);
      return false;
    }
  }

  async fechar() {
    this.pararMonitoramento();
    await this.database.fechar();
  }

  isAtivo() {
    return this.ativo;
  }
}

module.exports = Scheduler;
