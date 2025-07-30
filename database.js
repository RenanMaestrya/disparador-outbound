const mysql = require("mysql2/promise");
const fs = require("fs");

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.config = this.loadConfig();
  }

  loadConfig() {
    // Configurações padrão do MySQL
    return {
      host: process.env.MYSQL_HOST || "localhost",
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "disparador_whatsapp",
    };
  }

  async conectar() {
    try {
      // Primeiro conectar sem especificar database para criar se não existir
      const connectionWithoutDB = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
      });

      // Criar database se não existir
      await connectionWithoutDB.execute(
        `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\``
      );
      await connectionWithoutDB.end();

      // Conectar ao database específico
      this.connection = await mysql.createConnection(this.config);

      // Criar tabelas se não existirem
      await this.criarTabelas();

      console.log("✅ Conectado ao MySQL com sucesso!");
      return true;
    } catch (error) {
      console.log("❌ Erro ao conectar ao MySQL:", error.message);
      console.log(
        "💡 Certifique-se de que o MySQL está rodando e configure as variáveis de ambiente se necessário"
      );
      return false;
    }
  }

  async criarTabelas() {
    const criarTabelaEnvios = `
            CREATE TABLE IF NOT EXISTS envios_agendados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                telefone VARCHAR(20) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                mensagem TEXT NOT NULL,
                data_agendamento DATETIME NOT NULL,
                status ENUM('pendente', 'enviado', 'erro') DEFAULT 'pendente',
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_envio TIMESTAMP NULL,
                erro_mensagem TEXT NULL,
                INDEX idx_data_agendamento (data_agendamento),
                INDEX idx_status (status),
                INDEX idx_telefone (telefone)
            )
        `;

    const criarTabelaHistorico = `
            CREATE TABLE IF NOT EXISTS historico_envios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                telefone VARCHAR(20) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                mensagem TEXT NOT NULL,
                data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sucesso BOOLEAN DEFAULT TRUE,
                erro_mensagem TEXT NULL,
                INDEX idx_telefone (telefone),
                INDEX idx_data_envio (data_envio)
            )
        `;

    await this.connection.execute(criarTabelaEnvios);
    await this.connection.execute(criarTabelaHistorico);
  }

  async agendarEnvio(telefone, nome, mensagem, dataAgendamento) {
    const query = `
            INSERT INTO envios_agendados (telefone, nome, mensagem, data_agendamento)
            VALUES (?, ?, ?, ?)
        `;

    const [result] = await this.connection.execute(query, [
      telefone,
      nome,
      mensagem,
      dataAgendamento,
    ]);

    return result.insertId;
  }

  async obterEnviosPendentes(limite = 10) {
    const query = `
            SELECT * FROM envios_agendados 
            WHERE status = 'pendente' 
            AND data_agendamento <= NOW()
            ORDER BY data_agendamento ASC
            LIMIT ?
        `;

    const [rows] = await this.connection.execute(query, [limite]);
    return rows;
  }

  async marcarComoEnviado(id) {
    const query = `
            UPDATE envios_agendados 
            SET status = 'enviado', data_envio = NOW()
            WHERE id = ?
        `;

    await this.connection.execute(query, [id]);
  }

  async marcarComoErro(id, erroMensagem) {
    const query = `
            UPDATE envios_agendados 
            SET status = 'erro', erro_mensagem = ?
            WHERE id = ?
        `;

    await this.connection.execute(query, [erroMensagem, id]);
  }

  async adicionarAoHistorico(
    telefone,
    nome,
    mensagem,
    sucesso = true,
    erroMensagem = null
  ) {
    const query = `
            INSERT INTO historico_envios (telefone, nome, mensagem, sucesso, erro_mensagem)
            VALUES (?, ?, ?, ?, ?)
        `;

    await this.connection.execute(query, [
      telefone,
      nome,
      mensagem,
      sucesso,
      erroMensagem,
    ]);
  }

  async jaFoiEnviado(telefone) {
    const query = `
            SELECT COUNT(*) as count FROM historico_envios 
            WHERE telefone = ? AND sucesso = TRUE
        `;

    const [rows] = await this.connection.execute(query, [telefone]);
    return rows[0].count > 0;
  }

  async obterEstatisticas() {
    const queryTotal = `SELECT COUNT(*) as total FROM historico_envios WHERE sucesso = TRUE`;
    const queryPendentes = `SELECT COUNT(*) as pendentes FROM envios_agendados WHERE status = 'pendente'`;
    const queryUltimo = `
            SELECT nome, data_envio FROM historico_envios 
            WHERE sucesso = TRUE 
            ORDER BY data_envio DESC 
            LIMIT 1
        `;

    const [totalRows] = await this.connection.execute(queryTotal);
    const [pendentesRows] = await this.connection.execute(queryPendentes);
    const [ultimoRows] = await this.connection.execute(queryUltimo);

    return {
      totalEnviados: totalRows[0].total,
      enviosPendentes: pendentesRows[0].pendentes,
      ultimoEnvio: ultimoRows[0] || null,
    };
  }

  async limparHistorico() {
    await this.connection.execute("DELETE FROM historico_envios");
    await this.connection.execute("DELETE FROM envios_agendados");
    console.log("🧹 Histórico e agendamentos limpos com sucesso!");
  }

  async fechar() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}

module.exports = DatabaseManager;
