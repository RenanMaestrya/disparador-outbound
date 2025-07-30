const fs = require("fs");
const path = require("path");

// Implementação baseada na documentação oficial do Baileys
// Similar ao useMultiFileAuthState mas adaptada para produção
class AuthManager {
  constructor() {
    this.authDir = "./auth";
    this.ensureAuthDir();
  }

  ensureAuthDir() {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  // Função para obter o estado de autenticação
  async getAuthState() {
    const creds = this.loadCreds();
    const keys = this.loadKeys();

    const state = {
      creds: creds,
      keys: keys,
    };

    const saveCreds = () => {
      this.saveCreds(state.creds);
    };

    return { state, saveCreds };
  }

  loadCreds() {
    const credsPath = path.join(this.authDir, "creds.json");
    try {
      if (fs.existsSync(credsPath)) {
        const data = fs.readFileSync(credsPath, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.log("⚠️ Erro ao carregar credenciais:", error.message);
    }
    return {};
  }

  loadKeys() {
    const keysPath = path.join(this.authDir, "keys.json");
    try {
      if (fs.existsSync(keysPath)) {
        const data = fs.readFileSync(keysPath, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.log("⚠️ Erro ao carregar chaves:", error.message);
    }
    return {};
  }

  saveCreds(creds) {
    const credsPath = path.join(this.authDir, "creds.json");
    try {
      fs.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
    } catch (error) {
      console.log("❌ Erro ao salvar credenciais:", error.message);
    }
  }

  saveKeys(keys) {
    const keysPath = path.join(this.authDir, "keys.json");
    try {
      fs.writeFileSync(keysPath, JSON.stringify(keys, null, 2));
    } catch (error) {
      console.log("❌ Erro ao salvar chaves:", error.message);
    }
  }

  clearAuth() {
    const files = ["creds.json", "keys.json"];
    files.forEach((file) => {
      const filePath = path.join(this.authDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    console.log("🧹 Autenticação limpa com sucesso!");
  }
}

module.exports = AuthManager;
