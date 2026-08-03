# 🏥 Biochallenge Brasil 2026 — SUSpicious Totem

Bem-vindo ao repositório do **SUSpicious Totem**, uma solução inovadora de autoatendimento para **Unidades Básicas de Saúde (UBS)**. Este projeto visa otimizar o fluxo de pacientes, reduzir filas e melhorar a experiência de acolhimento inicial no **Sistema Único de Saúde (SUS)**.

---

## 👥 Equipe SUSpicious

| Integrante | Instituição |
|:-----------|:------------|
| **Arthur de Paula Dias** | UnB — Universidade de Brasília |
| **Gabriell de Luccas Rego Lourenço** | UnB — Universidade de Brasília |
| **Vinicius Carvalho Lima Alcanfor** | UnB — Universidade de Brasília |
| **Andrei** | UnB — Universidade de Brasília |

---

## 🎯 O Projeto

O sistema consiste em um **totem interativo** posicionado na entrada das UBSs. Ele opera integrado (ou com simulação de integração) ao **e-SUS PEC** e gerencia:

- 🩺 **Consultas Agendadas:** Direcionamento rápido do paciente ao consultório.
- 🏃 **Consultas Espontâneas:** Emissão de senhas e encaminhamento para triagem.
- 💉 **Vacinação:** Organização de filas com base na prioridade.
- 📱 **Triagem Digital:** Geração de QR Code para pacientes preencherem dados via smartphone, evitando lentidão no totem.

---

## 🚀 Arquitetura Tecnológica

| Camada | Tecnologia | Motivo |
|:-------|:-----------|:-------|
| **Backend / Hardware** | [FastAPI](https://fastapi.tiangolo.com/) (Python) | Rápido, async nativo, tipagem forte (Pydantic), documentação Swagger automática. Ideal para integrar com GPIO e impressora. |
| **Frontend (Kiosk UI)** | [React](https://react.dev/) (Vite) | Componentização, estado reativo, animações fluidas. Interface responsiva para touchscreen. |
| **Banco de Dados** | [SQLite](https://www.sqlite.org/) + [SQLModel](https://sqlmodel.tiangolo.com/) | Leve, sem servidor, resiliência offline. SQLModel integra tipagem Python com o ORM. |
| **Migrações** | [Alembic](https://alembic.sqlalchemy.org/) | Versionamento do schema do banco. Essencial para evoluir tabelas sem perder dados. |
| **Impressora** | [python-escpos](https://python-escpos.readthedocs.io/) | Padrão da indústria para impressoras térmicas ESC/POS via USB/Serial. |
| **QR Code** | [qrcode](https://pypi.org/project/qrcode/) | Gerador de QR Code em Python para cupom impresso. |

---

## 📁 Estrutura de Pastas

```
SUSpicious_Totem/
├── .gitignore                          # Arquivos/pastas ignorados pelo Git
├── README.md                           # ← Você está aqui
│
├── backend/                            # 🐍 API REST (FastAPI + Python)
│   ├── main.py                         # Ponto de entrada da aplicação FastAPI
│   ├── requirements.txt                # Dependências Python
│   ├── .env.example                    # Exemplo de variáveis de ambiente
│   ├── .env                            # Variáveis de ambiente reais (NÃO versionado)
│   ├── suspicious_totem.db             # Banco SQLite (gerado automaticamente)
│   └── app/
│       ├── core/
│       │   └── config.py               # Configurações centralizadas (Pydantic Settings)
│       ├── db/
│       │   └── session.py              # Engine SQLite + injeção de dependência (get_session)
│       ├── models/
│       │   └── ticket.py               # Modelos ORM: Ticket, TicketType, TicketStatus
│       ├── infrastructure/
│       │   └── printer.py              # Abstração de impressora (MockPrinter / EscPosPrinter)
│       └── api/
│           └── v1/
│               └── endpoints/
│                   └── tickets.py      # Rotas: POST /tickets, GET /tickets, GET /tickets/{id}
│
├── frontend/                           # ⚛️ Interface do Totem (React + Vite)
│   ├── index.html                      # HTML base (meta tags kiosk, Google Fonts)
│   ├── package.json                    # Dependências Node (React, Vite, Lucide Icons)
│   ├── vite.config.js                  # Configuração Vite (proxy /api → backend:8000)
│   ├── dist/                           # Build estático (gerado por npm run build)
│   └── src/
│       ├── main.jsx                    # Ponto de entrada React
│       ├── App.jsx                     # Componente raiz (orquestra telas)
│       ├── index.css                   # Estilos globais (design system, glassmorphism)
│       ├── components/
│       │   ├── Header.jsx              # Barra superior com logo e status de conexão
│       │   ├── ServiceCard.jsx         # Cartão de seleção de serviço (touch-friendly)
│       │   └── TicketModal.jsx         # Modal de exibição da senha gerada
│       └── services/
│           └── api.js                  # Funções de chamada à API (fetch / axios)
│
├── scripts/
│   └── setup_kiosk.sh                  # Script de instalação automática no Raspberry Pi
│
└── Docs/                               # Documentação adicional do projeto
```

---

## 🛠 Como Rodar Localmente (Windows)

### Pré-requisitos

| Ferramenta | Versão Mínima | Download |
|:-----------|:--------------|:---------|
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Git** | qualquer | [git-scm.com](https://git-scm.com/) |

> 💡 **Dica:** Ao instalar o Python no Windows, marque a opção **"Add Python to PATH"**.

---

### Passo 1 — Clonar o repositório

```powershell
cd D:\Projetinhos
git clone https://github.com/Gabriell-Ilius/SUSpicious_Totem
cd SUSpicious_Totem
```

---

### Passo 2 — Configurar e iniciar o Backend (FastAPI)

Abra um terminal (PowerShell ou CMD) e execute:

```powershell
# Entrar na pasta do backend
cd backend

# Criar ambiente virtual Python
python -m venv venv

# Ativar o ambiente virtual (PowerShell)
.\venv\Scripts\Activate.ps1
# (Se usar CMD em vez de PowerShell, use: venv\Scripts\activate.bat)

# Atualizar pip e instalar dependências
python -m pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env a partir do exemplo (se ainda não existir)
copy .env.example .env

# Iniciar o servidor FastAPI (com hot-reload)
uvicorn main:app --reload --port 8000
```

✅ **Resultado:** O backend estará rodando em `http://localhost:8000`
- Documentação Swagger (interativa): `http://localhost:8000/docs`
- Documentação ReDoc: `http://localhost:8000/redoc`

> ⚠️ **Mantenha esta janela aberta** enquanto estiver testando.

---

### Passo 3 — Configurar e iniciar o Frontend (React + Vite)

Abra **outro terminal** (mantenha o do backend aberto) e execute:

```powershell
# Voltar à raiz do projeto (se necessário)
cd D:\Projetinhos\SUSpicious_Totem

# Entrar na pasta do frontend
cd frontend

# Instalar dependências Node
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

✅ **Resultado:** O frontend estará rodando em `http://localhost:5173`
- O proxy do Vite redireciona automaticamente chamadas `/api` para o backend (`localhost:8000`).

> ⚠️ **Mantenha esta janela aberta** enquanto estiver testando.

---

### Passo 4 — Testar a criação de uma senha (Ticket)

Abra **outro terminal** e execute:

```powershell
curl -X POST http://localhost:8000/api/v1/tickets/ -H "Content-Type: application/json" -d "{\"type\":\"consulta\"}"
```

✅ **Resultado esperado:**
- O terminal do **backend** exibirá: `[MOCK PRINTER] Ticket: ESP-001`
- A resposta JSON conterá os dados do ticket criado.

---

### 📡 Testando Resiliência (Offline-First)

Desligue a rede Wi-Fi ou pare o Backend. O Frontend mostrará um *Badge Vermelho* de Sincronização Pausada, mas continuará emitindo senhas perfeitamente.

---

## 🍓 Como Rodar no Raspberry Pi 3B+ (Produção)

O totem roda em um **Raspberry Pi 3B+** com tela touchscreen. O navegador Chromium é iniciado em **Kiosk Mode** (tela cheia, sem barra de endereço).

### Pré-requisitos

- Raspberry Pi 3B+ com **Raspberry Pi OS (com Desktop)** instalado no MicroSD
- Conexão à internet (Wi-Fi ou Ethernet) para instalação inicial
- (Opcional) Impressora térmica ESC/POS conectada via USB
- (Opcional) Tela touchscreen de 7–10"

---

### Opção A — Script automático (recomendado)

```bash
# 1. Clone o repositório no Pi
cd ~
git clone https://github.com/Gabriell-Ilius/SUSpicious_Totem
cd SUSpicious_Totem

# 2. Dê permissão de execução ao script
chmod +x scripts/setup_kiosk.sh

# 3. Execute o script (ele faz TUDO automaticamente)
sudo ./scripts/setup_kiosk.sh

# 4. Ajuste o .env se necessário
nano backend/.env

# 5. Reinicie o Pi
sudo reboot
```

O script instalará pacotes, criará o ambiente virtual, fará o build do frontend, configurará regras USB e iniciará os services.

---

### Opção B — Passo a passo manual (comando por comando)

Se preferir ter controle total, copie e cole cada bloco abaixo **um de cada vez** no terminal do Pi.

#### B1 — Atualizar o SO e instalar pacotes

```bash
sudo apt update && sudo apt upgrade -y
```

```bash
sudo apt install -y python3-pip python3-venv nodejs npm chromium-browser unclutter libusb-1.0-0-dev git
```

> Se `chromium-browser` falhar, tente: `sudo apt install -y chromium`

#### B2 — Clonar o repositório

```bash
cd ~
git clone https://github.com/Gabriell-Ilius/SUSpicious_Totem
cd SUSpicious_Totem
```

#### B3 — Configurar o Backend

```bash
cd backend
```

```bash
python3 -m venv venv
```

```bash
source venv/bin/activate
```

```bash
python -m pip install --upgrade pip
```

```bash
pip install -r requirements.txt
```

```bash
cp .env.example .env
```

```bash
nano .env
```

> No `nano`, edite `PRINTER_MODE=mock` (ou `escpos` se tiver impressora). Salve com **Ctrl+O → Enter → Ctrl+X**.

#### B4 — Configurar o Frontend

```bash
cd ~/SUSpicious_Totem/frontend
```

```bash
npm install
```

```bash
npm run build
```

#### B5 — Criar o service do Backend (systemd)

```bash
sudo tee /etc/systemd/system/suspicious-totem-backend.service > /dev/null <<'EOF'
[Unit]
Description=SUSpicious Totem Backend (FastAPI)
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/SUSpicious_Totem/backend
Environment="PATH=/home/pi/SUSpicious_Totem/backend/venv/bin:/usr/bin:/bin"
ExecStart=/home/pi/SUSpicious_Totem/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

```bash
sudo systemctl daemon-reload
```

```bash
sudo systemctl enable suspicious-totem-backend.service
```

```bash
sudo systemctl start suspicious-totem-backend.service
```

#### B6 — Criar o service do Frontend (serve estático)

```bash
sudo npm install -g serve
```

```bash
sudo tee /etc/systemd/system/suspicious-totem-frontend.service > /dev/null <<'EOF'
[Unit]
Description=SUSpicious Totem Frontend (static)
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/SUSpicious_Totem/frontend
ExecStart=/usr/local/bin/serve -s dist -l 5173
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

```bash
sudo systemctl daemon-reload
```

```bash
sudo systemctl enable suspicious-totem-frontend.service
```

```bash
sudo systemctl start suspicious-totem-frontend.service
```

#### B7 — Regra udev para impressora USB (se usar modo real)

```bash
sudo tee /etc/udev/rules.d/99-escpos.rules > /dev/null <<'EOF'
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0202", MODE="0666"
EOF
```

```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

> 💡 Substitua `04b8` e `0202` pelos IDs reais da sua impressora. Descubra com: `lsusb`

#### B8 — Configurar modo Kiosk (Chromium em tela cheia)

```bash
sudo tee /etc/xdg/autostart/kiosk.desktop > /dev/null <<'EOF'
[Desktop Entry]
Type=Application
Name=TotemKiosk
Exec=chromium-browser --kiosk --no-first-run --disable-infobars --disable-translate http://localhost:5173
EOF
```

#### B9 — Reiniciar e validar

```bash
sudo reboot
```

Após o reboot, verifique:

```bash
systemctl status suspicious-totem-backend.service
```

```bash
systemctl status suspicious-totem-frontend.service
```

```bash
curl http://localhost:8000/docs
```

```bash
curl http://localhost:5173/
```

---

### ✅ O que deve acontecer após o reboot

1. 🖥️ O **Chromium** abre automaticamente em modo **kiosk** mostrando a UI do Totem.
2. 🐍 O **backend FastAPI** está escutando em `http://localhost:8000`.
3. ⚛️ O **frontend** está servindo arquivos estáticos na porta `5173`.
4. 🖨️ Se `PRINTER_MODE=mock`, os tickets aparecem no log do backend; se `PRINTER_MODE=escpos`, são impressos na impressora USB.

### 🐛 Debugando problemas

Se algo não funcionar após o reboot, verifique os logs dos services:

```bash
# Ver logs do backend
journalctl -u suspicious-totem-backend.service -b --no-pager

# Ver logs do frontend
journalctl -u suspicious-totem-frontend.service -b --no-pager
```

---

## ⚙️ Variáveis de Ambiente (.env)

O arquivo `backend/.env` controla o comportamento da aplicação. Copie de `.env.example`:

| Variável | Descrição | Valores |
|:---------|:----------|:--------|
| `PROJECT_NAME` | Nome exibido na documentação Swagger | `"SUSpicious Totem"` |
| `PRINTER_MODE` | Modo da impressora | `mock` (terminal) ou `escpos` (impressora real) |
| `PRINTER_VENDOR_ID` | ID do fabricante USB (só se `PRINTER_MODE=escpos`) | Ex.: `0x04b8` |
| `PRINTER_PRODUCT_ID` | ID do produto USB (só se `PRINTER_MODE=escpos`) | Ex.: `0x0202` |
| `DATABASE_URL` | Caminho do banco SQLite | `sqlite:///./suspicious_totem.db` |
| `ESUS_API_URL` | URL da API do e-SUS PEC | URL da UBS ou mock |
| `ESUS_API_TOKEN` | Token de autenticação do e-SUS | Token fornecido pela UBS |

> 📌 **Nota:** No ambiente de desenvolvimento (Windows), a impressora é simulada automaticamente via interface mock. Não é necessário ter o Raspberry Pi conectado para programar.

---

## ⚠️ Pendências Futuras (Ajustes Físicos)

Como o hardware exato varia por UBS, as seguintes configurações precisam de sintonia fina antes da entrega final no postinho:

- 🖨️ **Modelo da Impressora:** No arquivo `backend/app/infrastructure/printer.py`, os valores `vendor_id` (0x04b8) e `product_id` (0x0202) representam uma Epson genérica. Devem ser trocados pelos IDs reais da impressora (descubra com `lsusb` no Pi).
- 🌐 **Domínio da Triagem:** O QR Code impresso no cupom aponta para o IP de desenvolvimento local. Deve ser atualizado para o URL público do sistema web da UBS.
- 🔐 **Credenciais do e-SUS:** A integração offline envia dados para o PEC. As senhas da API do e-SUS devem ser preenchidas no `.env` de produção.

---

## 🤝 Guia de Contribuição

### Branches

| Branch | Uso |
|:-------|:----|
| `main` | Código estável e revisado. **Nunca commite diretamente aqui.** |
| `develop` | Branch de integração. PRs de features são mergeados aqui. |
| `totem-andrei` | Branch do Andrei para desenvolvimento do Totem. |
| `feature/*` | Uma branch por funcionalidade (ex: `feature/tela-triagem`). |
| `fix/*` | Correções de bugs (ex: `fix/impressora-timeout`). |

### Padrão de Commits (Conventional Commits)

```
feat: adiciona tela de inserção de CPF
fix: corrige timeout da impressora após 30s
docs: atualiza README com instruções de deploy
refactor: extrai lógica de fila para FilaService
test: adiciona testes unitários para GerarSenha
```

### Fluxo de Trabalho

1. Crie uma branch a partir de `develop`:
   ```bash
   git checkout -b feature/nome-da-feature develop
   ```
2. Desenvolva e commite seguindo o padrão acima.
3. Abra um **Pull Request** para `develop`.
4. Após revisão e aprovação, faça o merge.

---

## 🗺️ Roadmap

| Fase | Descrição | Status |
|:-----|:----------|:-------|
| 1️⃣ | Boilerplate completo (Backend + Frontend + Kiosk Script) | ✅ Concluído |
| 2️⃣ | Tela de seleção de serviço (Consulta, Vacina, Triagem) | ✅ Concluído |
| 3️⃣ | Emissão de senhas e integração com impressora mock | ✅ Concluído |
| 4️⃣ | Integração real com impressora ESC/POS no Raspberry Pi | 🔲 Pendente |
| 5️⃣ | Dashboard admin para visualizar filas e estatísticas | 🔲 Pendente |
| 6️⃣ | Integração com e-SUS PEC (simulada → real) | 🔲 Pendente |
| 7️⃣ | WebSocket para atualização de fila em tempo real | 🔲 Pendente |
| 8️⃣ | Testes automatizados (pytest + httpx) | 🔲 Pendente |

---

## 📄 Licença

*A definir conforme regulamento do Biochallenge Brasil 2026.*
