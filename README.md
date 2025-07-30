# 🎯 Disparador WhatsApp - Outbound

Aplicação Node.js para disparo automático de mensagens WhatsApp usando Baileys com tempos aleatórios entre envios.

## ✨ Funcionalidades

- 🔐 **Autenticação via QR Code** - Conecta ao WhatsApp Web
- 📊 **Leitura de planilha Excel** - Carrega contatos automaticamente
- ⏰ **Tempos aleatórios** - Entre 30s e 2min entre envios
- ⏸️ **Pausas extras** - A cada 10-14 envios (5-10min)
- 💾 **Persistência de sessão** - Não precisa escanear QR toda vez
- 📝 **Logs detalhados** - Acompanhe o progresso em tempo real

## 🚀 Instalação

1. **Clone o repositório:**

```bash
git clone <seu-repositorio>
cd disparador-outbound
```

2. **Instale as dependências:**

```bash
npm install
```

3. **Configure a planilha:**
   - Crie um arquivo `contatos.xlsx` na raiz do projeto
   - Ou execute a aplicação uma vez para criar a planilha exemplo

## 📋 Formato da Planilha

A planilha deve ter **duas abas**:

### Aba 1: "Contatos"

| Nome         | Telefone    |
| ------------ | ----------- |
| João Silva   | 11999887766 |
| Maria Santos | 21988776655 |
| Pedro Costa  | 31977665544 |

**Colunas obrigatórias:**

- **Nome**: Nome do contato (usado para logs)
- **Telefone**: Número no formato brasileiro (DDD + número)

### Aba 2: "Mensagens"

| Mensagem                                        |
| ----------------------------------------------- |
| Olá! Tudo bem? Esta é uma mensagem de teste.    |
| Oi! Como você está? Espero que esteja tudo bem! |
| Olá! Que tal? Tenha um ótimo dia!               |

**Como funciona:**

- Se houver **uma mensagem**: Todos recebem a mesma mensagem
- Se houver **múltiplas mensagens**: Cada contato recebe uma mensagem escolhida aleatoriamente
- Se **não houver mensagens**: Usa a mensagem padrão do arquivo `config.env`

### Aba 3: "Configurações"

| Configuração      | Valor |
| ----------------- | ----- |
| Horário de Início | 09:00 |

**Configurações disponíveis:**

- **Horário de Início**: Horário para iniciar os envios (formato HH:MM)
- **Deixe vazio**: Para envio imediato após conexão

## 📅 Sistema de Agendamento

A aplicação possui um sistema simples de agendamento por horário:

### Funcionamento:

- 🕐 **Sem horário**: Envio imediato após conexão
- ⏰ **Com horário**: Aguarda o horário especificado para iniciar TODOS os envios
- 📅 **Repetição**: O horário se repete todos os dias automaticamente
- 🌎 **Fuso horário**: Configurado para America/Sao_Paulo

### Exemplos:

- **09:00** - Inicia às 9h da manhã todos os dias
- **14:30** - Inicia às 14h30 todos os dias
- **Vazio** - Inicia imediatamente após conectar

**Nota**: Todos os contatos são enviados em sequência após o horário configurado, respeitando os tempos aleatórios entre envios.

## ⚙️ Configuração

Edite o arquivo `config.env` para personalizar:

```env
# Caminho da planilha
PLANILHA_PATH=./contatos.xlsx

# Mensagem padrão (usada quando não há mensagem personalizada)
MENSAGEM_PADRAO=Olá! Esta é uma mensagem de teste do disparador automático.

# Tempos entre envios (em milissegundos)
MIN_TEMPO_ENTRE_ENVIOS=5000     # 5 segundos
MAX_TEMPO_ENTRE_ENVIOS=15000    # 15 segundos

# Tempos de pausa extra (em milissegundos)
MIN_TEMPO_PAUSA_EXTRA=60000     # 1 minuto
MAX_TEMPO_PAUSA_EXTRA=120000    # 2 minutos

# Quantidade de envios para pausa extra
ENVIOS_PARA_PAUSA_MIN=10
ENVIOS_PARA_PAUSA_MAX=14
```

## 🎮 Como Usar

### 1. Primeira execução:

```bash
npm start
```

A aplicação irá:

- Criar a planilha exemplo se não existir
- Mostrar um QR Code no terminal
- Escaneie com seu WhatsApp

### 2. Execuções subsequentes:

```bash
npm start
```

A sessão será mantida automaticamente.

### 3. Limpar autenticação (se necessário):

```bash
npm start -- --clear-auth
```

### 4. Gerenciar histórico de envios:

```bash
# Ver estatísticas de envios
npm start -- --show-history

# Limpar histórico (permitir reenvio para todos)
npm start -- --clear-history
```

## 📱 Processo de Conexão

1. **Primeira vez:**

   - QR Code aparece no terminal
   - Escaneie com WhatsApp → Câmera → QR Code
   - Aguarde conexão

2. **Próximas vezes:**
   - Conexão automática
   - Início do disparo

## 🚫 Controle de Envios

A aplicação **nunca reenvia** mensagens para o mesmo contato:

- ✅ **Histórico automático**: Cada envio é registrado em `envios-realizados.json`
- 🔍 **Verificação inteligente**: Contatos que já receberam são automaticamente ignorados
- 📊 **Estatísticas**: Veja quantas mensagens foram enviadas e quando
- 🧹 **Limpeza opcional**: Use `--clear-history` para permitir reenvios

## ⏰ Lógica de Tempos

- **Entre envios:** 5 a 15 segundos (aleatório)
- **Pausas extras:** A cada 10-14 envios (aleatório)
- **Duração da pausa:** 1 a 2 minutos (aleatório)

## 📊 Logs e Monitoramento

A aplicação mostra logs detalhados:

```
🎯 DISPARADOR WHATSAPP - OUTBOUND
=====================================

📋 Configurações carregadas:
   Planilha: ./contatos.xlsx
   Tempo entre envios: 30s - 120s
   Pausa extra: 300s - 600s
   Pausa a cada: 10-14 envios

📱 Escaneie o QR Code para conectar:
[QR Code ASCII]

✅ Conectado ao WhatsApp!
📤 Iniciando disparo de 3 mensagens...
⏰ Tempos aleatórios entre envios: 30s - 2min
⏸️  Pausas extras a cada 10-14 envios: 5-10min

📤 Enviando para João Silva (5511999887766@c.us)...
✅ Enviado para João Silva
⏳ Aguardando 45s antes do próximo envio...
```

## 🔧 Comandos Úteis

```bash
# Executar aplicação
npm start

# Executar em modo desenvolvimento (com auto-reload)
npm run dev

# Limpar autenticação
npm start -- --clear-auth
```

## 📁 Estrutura do Projeto

```
disparador-outbound/
├── index.js              # Arquivo principal
├── disparador.js         # Lógica do disparador
├── auth.js              # Gerenciamento de autenticação
├── planilha.js          # Leitura de planilhas Excel
├── config.env           # Configurações
├── package.json         # Dependências
├── README.md           # Documentação
└── auth/               # Pasta com dados de autenticação
    ├── creds.json
    ├── keys.json
    └── store.json
```

## ⚠️ Importante

- **Use com responsabilidade** - Respeite os limites do WhatsApp
- **Não abuse** - Evite enviar muitas mensagens rapidamente
- **Teste primeiro** - Use com poucos contatos inicialmente
- **Mantenha atualizado** - Atualize as dependências regularmente

## 🐛 Solução de Problemas

### QR Code não aparece

- Verifique a conexão com a internet
- Tente limpar a autenticação: `npm start -- --clear-auth`

### Erro ao ler planilha

- Verifique se o arquivo existe
- Confirme se tem as colunas corretas
- Verifique o formato dos números de telefone

### Mensagens não são enviadas

- Verifique se o número está no formato correto
- Confirme se o contato existe no WhatsApp
- Verifique se não há bloqueios

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
