const {
  makeWASocket,
  DisconnectReason,
  Browsers,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode");
const P = require("pino");
const AuthManager = require("./auth");
const PlanilhaManager = require("./planilha");
const ControleEnvios = require("./controle-envios");
const HorarioScheduler = require("./horario-scheduler");

class DisparadorWhatsApp {
  constructor(config) {
    this.config = config;
    this.authManager = new AuthManager();
    this.planilhaManager = new PlanilhaManager(config.planilhaPath);
    this.controleEnvios = new ControleEnvios();
    this.horarioScheduler = new HorarioScheduler(this);
    this.sock = null;
    this.contatos = [];
    this.mensagens = [];
    this.enviados = 0;
    this.conectado = false;

    // Configurações de tempo
    this.minTempoEntreEnvios = config.minTempoEntreEnvios || 30000; // 30 segundos
    this.maxTempoEntreEnvios = config.maxTempoEntreEnvios || 120000; // 2 minutos
    this.minTempoPausaExtra = config.minTempoPausaExtra || 300000; // 5 minutos
    this.maxTempoPausaExtra = config.maxTempoPausaExtra || 600000; // 10 minutos
    this.enviosParaPausaMin = config.enviosParaPausaMin || 10;
    this.enviosParaPausaMax = config.enviosParaPausaMax || 14;
  }

  async inicializar() {
    try {
      console.log("🚀 Iniciando disparador de mensagens WhatsApp...");

      // Carregar contatos da planilha
      await this.carregarContatos();

      // Configurar socket do Baileys
      await this.configurarSocket();
    } catch (error) {
      console.error("❌ Erro ao inicializar:", error.message);
      throw error;
    }
  }

  async carregarContatos() {
    try {
      const dados = await this.planilhaManager.lerContatos();
      const todosContatos = dados.contatos;
      this.mensagens = dados.mensagens;
      this.configuracoes = dados.configuracoes;

      console.log(`📋 ${todosContatos.length} contatos carregados da planilha`);

      // Mostrar histórico de envios
      this.controleEnvios.mostrarHistorico();

      // Filtrar contatos que ainda não receberam mensagens
      this.contatos =
        this.controleEnvios.filtrarContatosNaoEnviados(todosContatos);

      console.log(`📤 ${this.contatos.length} contatos pendentes para envio`);

      if (this.contatos.length === 0) {
        console.log("✅ Todos os contatos já receberam mensagens!");
        console.log(
          "💡 Use --clear-history para limpar o histórico e reenviar para todos"
        );
        return;
      }

      // Configurar horário de início se especificado
      if (this.configuracoes.horarioInicio) {
        console.log(
          `📅 Configurando horário de início: ${this.configuracoes.horarioInicio}`
        );
        this.horarioScheduler.iniciarAgendamento(
          this.configuracoes.horarioInicio
        );
      } else {
        console.log("📤 Envio imediato configurado (sem horário específico)");
      }

      if (this.mensagens.length > 0) {
        console.log(
          `💬 ${this.mensagens.length} mensagens carregadas para envio aleatório`
        );
      } else {
        console.log(
          `💬 Usando mensagem padrão (nenhuma mensagem encontrada na aba "Mensagens")`
        );
      }
    } catch (error) {
      console.log("📝 Criando planilha exemplo...");
      await this.planilhaManager.criarPlanilhaExemplo();
      throw new Error("Crie a planilha com seus contatos e execute novamente");
    }
  }

  async configurarSocket() {
    console.log("🔐 Configurando conexão WhatsApp...");

    // Usar useMultiFileAuthState conforme documentação oficial
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    this.sock = makeWASocket({
      auth: state,
      logger: P({ level: "silent" }),
      browser: Browsers.macOS("Desktop"),
      markOnlineOnConnect: false,
    });

    // Configurar eventos
    this.configurarEventos(saveCreds);
  }

  configurarEventos(saveCreds) {
    // Evento de atualização de conexão (seguindo documentação)
    this.sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log("🔄 Status da conexão:", connection);

      // Mostrar QR Code conforme documentação
      if (qr) {
        console.log("\n📱 Escaneie o QR Code para conectar:");
        try {
          const qrString = await QRCode.toString(qr, {
            type: "terminal",
            small: true,
          });
          console.log(qrString);
          console.log(
            "\n💡 Dica: Use o WhatsApp no seu celular para escanear o QR Code acima"
          );
        } catch (error) {
          console.log("❌ Erro ao gerar QR Code:", error.message);
        }
      }

      if (connection === "open") {
        console.log("✅ Conectado ao WhatsApp!");
        this.conectado = true;

        // Se não há horário configurado, iniciar disparo imediatamente
        if (!this.configuracoes?.horarioInicio) {
          await this.iniciarDisparo();
        }
      }

      if (connection === "close") {
        console.log("❌ Desconectado do WhatsApp");
        if (lastDisconnect?.error) {
          console.log("🔍 Motivo da desconexão:", lastDisconnect.error.message);
        }
        this.conectado = false;

        // Verificar se deve reconectar (seguindo documentação)
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log("🔄 Reconectando em 5 segundos...");
          setTimeout(async () => {
            try {
              await this.configurarSocket();
            } catch (error) {
              console.log("❌ Erro ao reconectar:", error.message);
            }
          }, 5000);
        }
      }
    });

    // Evento de atualização de credenciais (seguindo documentação)
    this.sock.ev.on("creds.update", saveCreds);
  }

  async iniciarDisparo() {
    if (this.contatos.length === 0) {
      console.log("❌ Nenhum contato para enviar mensagens");
      return;
    }

    console.log(`📤 Iniciando disparo de ${this.contatos.length} mensagens...`);
    console.log("⏰ Tempos aleatórios entre envios: 30s - 2min");
    console.log("⏸️  Pausas extras a cada 10-14 envios: 5-10min");
    console.log("");

    const intervaloEntreGrupos = this.getNumeroAleatorio(
      this.enviosParaPausaMin,
      this.enviosParaPausaMax
    );

    for (let i = 0; i < this.contatos.length; i++) {
      const contato = this.contatos[i];

      try {
        await this.enviarMensagem(contato);
        this.enviados++;

        // Verificar se precisa fazer pausa extra
        if (this.enviados % intervaloEntreGrupos === 0) {
          await this.fazerPausaExtra();
        } else if (i < this.contatos.length - 1) {
          // Não pausar após o último envio
          await this.fazerPausaNormal();
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar para ${contato.nome}:`, error.message);
      }
    }

    console.log(`\n✅ Disparo concluído! ${this.enviados} mensagens enviadas.`);
  }

  async enviarMensagem(contato) {
    // Escolher mensagem aleatória se existirem mensagens na planilha
    let mensagem;
    if (this.mensagens.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * this.mensagens.length);
      mensagem = this.mensagens[indiceAleatorio];
    } else {
      mensagem = this.config.mensagemPadrao;
    }

    console.log(`📤 Enviando para ${contato.nome} (${contato.telefone})...`);

    try {
      await this.sock.sendMessage(contato.telefone, { text: mensagem });
      console.log(`✅ Enviado para ${contato.nome}`);

      // Marcar como enviado no controle
      this.controleEnvios.marcarComoEnviado(
        contato.telefone,
        contato.nome,
        mensagem
      );

      // Mostrar qual mensagem foi enviada se houver múltiplas
      if (this.mensagens.length > 1) {
        console.log(
          `💬 Mensagem: "${mensagem.substring(0, 50)}${
            mensagem.length > 50 ? "..." : ""
          }"`
        );
      }
    } catch (error) {
      console.error(`❌ Falha ao enviar para ${contato.nome}:`, error.message);
      throw error;
    }
  }

  async fazerPausaNormal() {
    const tempo = this.getNumeroAleatorio(
      this.minTempoEntreEnvios,
      this.maxTempoEntreEnvios
    );
    console.log(
      `⏳ Aguardando ${Math.round(tempo / 1000)}s antes do próximo envio...`
    );
    await this.sleep(tempo);
  }

  async fazerPausaExtra() {
    const tempo = this.getNumeroAleatorio(
      this.minTempoPausaExtra,
      this.maxTempoPausaExtra
    );
    console.log(
      `⏸️  Pausa extra de ${Math.round(tempo / 1000)}s após ${
        this.enviados
      } envios...`
    );
    await this.sleep(tempo);
  }

  getNumeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  limparAuth() {
    this.authManager.clearAuth();
  }

  limparHistorico() {
    this.controleEnvios.limparHistorico();
  }

  mostrarHistorico() {
    this.controleEnvios.mostrarHistorico();
  }
}

module.exports = DisparadorWhatsApp;
