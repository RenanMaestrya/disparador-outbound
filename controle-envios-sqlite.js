const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class ControleEnviosSQLite {
  constructor() {
    this.dbPath = "./envios.db";
    this.db = null;
    this.duracaoControle = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
  }

  async inicializar() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.log("❌ Erro ao conectar SQLite:", err.message);
          reject(err);
          return;
        }

        console.log("✅ SQLite conectado com sucesso!");
        this.criarTabela().then(resolve).catch(reject);
      });
    });
  }

  async criarTabela() {
    return new Promise((resolve, reject) => {
      const sql = `
                CREATE TABLE IF NOT EXISTS envios_realizados (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    telefone TEXT NOT NULL,
                    nome TEXT NOT NULL,
                    mensagem TEXT NOT NULL,
                    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(telefone)
                )
            `;

      this.db.run(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          // Limpar registros antigos (mais de 24h)
          this.limparRegistrosAntigos().then(resolve).catch(reject);
        }
      });
    });
  }

  async limparRegistrosAntigos() {
    return new Promise((resolve, reject) => {
      const sql = `
                DELETE FROM envios_realizados 
                WHERE datetime(data_envio) < datetime('now', '-24 hours')
            `;

      this.db.run(sql, function (err) {
        if (err) {
          console.log("⚠️ Erro ao limpar registros antigos:", err.message);
          reject(err);
        } else {
          if (this.changes > 0) {
            console.log(
              `🧹 ${this.changes} registros antigos removidos (>24h)`
            );
          }
          resolve();
        }
      });
    });
  }

  async jaFoiEnviado(telefone) {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT COUNT(*) as count 
                FROM envios_realizados 
                WHERE telefone = ? 
                AND datetime(data_envio) > datetime('now', '-24 hours')
            `;

      this.db.get(sql, [telefone], (err, row) => {
        if (err) {
          console.log("⚠️ Erro ao verificar envio:", err.message);
          resolve(false); // Em caso de erro, permitir envio
        } else {
          resolve(row.count > 0);
        }
      });
    });
  }

  async marcarComoEnviado(telefone, nome, mensagem) {
    return new Promise((resolve, reject) => {
      // Usar REPLACE para atualizar se já existir
      const sql = `
                REPLACE INTO envios_realizados (telefone, nome, mensagem, data_envio)
                VALUES (?, ?, ?, datetime('now'))
            `;

      this.db.run(sql, [telefone, nome, mensagem], function (err) {
        if (err) {
          console.log("❌ Erro ao marcar como enviado:", err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async obterEstatisticas() {
    return new Promise((resolve, reject) => {
      const sql = `
                SELECT 
                    COUNT(*) as total_24h,
                    MAX(data_envio) as ultimo_envio
                FROM envios_realizados 
                WHERE datetime(data_envio) > datetime('now', '-24 hours')
            `;

      this.db.get(sql, [], (err, row) => {
        if (err) {
          console.log("⚠️ Erro ao obter estatísticas:", err.message);
          resolve({ total_24h: 0, ultimo_envio: null });
        } else {
          resolve({
            total_24h: row.total_24h || 0,
            ultimo_envio: row.ultimo_envio,
          });
        }
      });
    });
  }

  async filtrarContatosNaoEnviados(contatos) {
    const contatosNaoEnviados = [];
    const contatosJaEnviados = [];

    for (const contato of contatos) {
      const jaEnviado = await this.jaFoiEnviado(contato.telefone);

      if (jaEnviado) {
        contatosJaEnviados.push(contato);
      } else {
        contatosNaoEnviados.push(contato);
      }
    }

    if (contatosJaEnviados.length > 0) {
      console.log(
        `⏭️  ${contatosJaEnviados.length} contatos ignorados (enviado nas últimas 24h):`
      );
      contatosJaEnviados.forEach((contato) => {
        console.log(`   • ${contato.nome} (${contato.telefone})`);
      });
      console.log("");
    }

    return contatosNaoEnviados;
  }

  async mostrarHistorico() {
    try {
      const stats = await this.obterEstatisticas();
      console.log(`📊 Controle de envios (24h):`);
      console.log(`   Total enviado: ${stats.total_24h} mensagens`);

      if (stats.ultimo_envio) {
        const dataFormatada = new Date(stats.ultimo_envio + "Z").toLocaleString(
          "pt-BR"
        );
        console.log(`   Último envio: ${dataFormatada}`);
      }
      console.log("");
    } catch (error) {
      console.log("⚠️ Erro ao mostrar histórico:", error.message);
    }
  }

  async limparHistorico() {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM envios_realizados";

      this.db.run(sql, function (err) {
        if (err) {
          console.log("❌ Erro ao limpar histórico:", err.message);
          reject(err);
        } else {
          console.log("🧹 Histórico de envios limpo com sucesso!");
          resolve();
        }
      });
    });
  }

  async fechar() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.log("⚠️ Erro ao fechar SQLite:", err.message);
          }
          resolve();
        });
      });
    }
  }
}

module.exports = ControleEnviosSQLite;
