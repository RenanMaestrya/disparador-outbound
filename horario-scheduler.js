const cron = require("node-cron");

class HorarioScheduler {
  constructor(disparador) {
    this.disparador = disparador;
    this.cronJob = null;
    this.horarioConfiguracao = null;
    this.ativo = false;
  }

  configurarHorario(horario) {
    // Horário no formato "HH:MM" (ex: "14:30", "09:00")
    if (!this.validarHorario(horario)) {
      throw new Error("Horário inválido. Use o formato HH:MM (ex: 14:30)");
    }

    this.horarioConfiguracao = horario;

    // Converter para formato cron (minuto hora * * *)
    const [hora, minuto] = horario.split(":");
    const cronExpression = `${minuto} ${hora} * * *`;

    console.log(`⏰ Horário configurado: ${horario} (todos os dias)`);
    return cronExpression;
  }

  validarHorario(horario) {
    const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(horario);
  }

  iniciarAgendamento(horario) {
    try {
      const cronExpression = this.configurarHorario(horario);

      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob.destroy();
      }

      this.cronJob = cron.schedule(
        cronExpression,
        async () => {
          console.log(
            `\n🔔 Horário agendado atingido: ${this.horarioConfiguracao}`
          );
          console.log("📤 Iniciando disparo automático de mensagens...\n");

          if (this.disparador.conectado) {
            await this.disparador.iniciarDisparo();
          } else {
            console.log(
              "❌ WhatsApp não conectado. Agendamento será executado na próxima conexão."
            );
          }
        },
        {
          scheduled: false,
          timezone: "America/Sao_Paulo",
        }
      );

      this.cronJob.start();
      this.ativo = true;

      const agora = new Date();
      const proximaExecucao = this.calcularProximaExecucao(horario);

      console.log(`📅 Agendamento ativo para ${horario}`);
      console.log(
        `⏭️ Próxima execução: ${proximaExecucao.toLocaleString("pt-BR")}`
      );

      return true;
    } catch (error) {
      console.log("❌ Erro ao configurar agendamento:", error.message);
      return false;
    }
  }

  calcularProximaExecucao(horario) {
    const [hora, minuto] = horario.split(":").map(Number);
    const agora = new Date();
    const proximaExecucao = new Date();

    proximaExecucao.setHours(hora, minuto, 0, 0);

    // Se o horário já passou hoje, agendar para amanhã
    if (proximaExecucao <= agora) {
      proximaExecucao.setDate(proximaExecucao.getDate() + 1);
    }

    return proximaExecucao;
  }

  pararAgendamento() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob.destroy();
      this.cronJob = null;
      this.ativo = false;
      console.log("⏹️ Agendamento pausado");
    }
  }

  verificarHorarioAgora(horario) {
    const agora = new Date();
    const [hora, minuto] = horario.split(":").map(Number);

    return agora.getHours() === hora && agora.getMinutes() === minuto;
  }

  obterStatus() {
    return {
      ativo: this.ativo,
      horario: this.horarioConfiguracao,
      proximaExecucao: this.horarioConfiguracao
        ? this.calcularProximaExecucao(this.horarioConfiguracao)
        : null,
    };
  }

  destruir() {
    this.pararAgendamento();
  }
}

module.exports = HorarioScheduler;
