# Biochallenge Brasil 2026 - SUSpicious Totem

Bem-vindo ao repositório do **SUSpicious Totem**, uma solução inovadora de autoatendimento para Unidades Básicas de Saúde (UBS). Este projeto visa otimizar o fluxo de pacientes, reduzir filas e melhorar a experiência de acolhimento inicial no Sistema Único de Saúde (SUS).

## 👥 Equipe SUSpicious

| Integrante | Instituição |
|:-----------|:------------|
| **Arthur de Paula Dias** | UnB — Universidade de Brasília |
| **Gabriell de Luccas Rego Lourenço** | UnB — Universidade de Brasília |
| **Vinicius Carvalho Lima Alcanfor** | UnB — Universidade de Brasília |

---

## 🎯 O Projeto

O sistema consiste em um totem interativo posicionado na entrada das UBSs. Ele opera com arquitetura **Local-First / Offline-First** integrado (ou com simulação de espelhamento) ao e-SUS PEC:
- **Fluxo CPF-First:** Reconhece agendamentos do e-SUS e direciona automaticamente o paciente ao consultório e médico de destino.
- **Consultas Espontâneas & Acolhimento:** Emissão de senhas e encaminhamento para triagem.
- **Vacinação & Imunização:** Organização de filas com base na prioridade.
- **Farmácia Básica:** Fila dedicada para retirada de medicamentos com receita.
- **Pré-Triagem Digital (QR Code):** Geração de QR Code no cupom impresso com formulário clínico para o paciente preencher no smartphone enquanto aguarda.
- **Painel de Senhas para TV (`/painel`):** Interface visual para monitor na sala de espera.

---

## 🎭 CPFs de Demonstração para o Pitch

O backend inclui um mecanismo de *seed dinâmico* que roda na inicialização e garante que os seguintes CPFs sempre tenham agendamentos válidos para a **data e hora de hoje**:

| CPF | Paciente | Destino Mockado | Horário |
|:----|:---------|:----------------|:--------|
| `111.111.111-11` | **João da Silva Santos (Demo Pitch)** | Consultório 02 - Dra. Camila Rocha | Hoje (+1h) |
| `123.456.789-00` | Maria Silva Santos | Consultório 01 - Dra. Ana Costa | Hoje |
| `987.654.321-00` | João Pereira Oliveira | Consultório 04 - Dr. Carlos Souza | Hoje (+2h) |
| `111.222.333-44` | Francisca Rodrigues | Consultório 01 - Dra. Ana Costa | Hoje (+3h) |

> 💡 **Para testar o fluxo sem agendamento prévio:** Digite qualquer outro CPF (ex: `000.000.000-00`) ou clique em **"Não Sei / Pular CPF"**.

---

## 🚀 Arquitetura Tecnológica

| Camada | Tecnologia | Motivo |
|:-------|:-----------|:-------|
| **Backend / Hardware** | [FastAPI](https://fastapi.tiangolo.com/) (Python) | Rápido, async nativo, Clean Architecture, Pydantic, documentação Swagger automática. |
| **Frontend (Kiosk UI)** | [React](https://react.dev/) (Vite) | Componentização, Framer Motion, suporte a Touchscreen e Teclado Numérico USB físico. |
| **Banco de Dados** | [SQLite](https://www.sqlite.org/) + [SQLModel](https://sqlmodel.tiangolo.com/) | Leve, sem servidor, resiliência offline. |
| **Impressora** | [python-escpos](https://python-escpos.readthedocs.io/) | Padrão da indústria para impressoras térmicas ESC/POS via USB (com fallback para terminal). |

---

## 🛠️ Como Rodar Localmente (Desenvolvimento)

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
A API estará em `http://localhost:8000` (Swagger interativo em `/docs`).

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
O Totem estará em `http://localhost:5173`.

---

## 🖨️ Hardware & Deploy no Raspberry Pi

O repositório inclui um instalador automatizado para Raspberry Pi 3B+, 4 e 5:

```bash
cd ~
git clone https://github.com/Gabriell-Ilius/SUSpicious_Totem
cd SUSpicious_Totem
chmod +x scripts/setup_kiosk.sh
sudo ./scripts/setup_kiosk.sh
```

O script configura:
- Pacotes do sistema e drivers de Touch Screen DSI/HDMI (`xinput`, `dtoverlay`).
- Proteção do Cartão SD via RAM Disk (`tmpfs` em `/var/log` e `/tmp`).
- Serviço Systemd de auto-inicialização no boot.
- Autostart do Chromium em tela cheia (Kiosk Mode) e atalho `Rodar_Totem.sh` no Desktop.

---

## 📄 Licença

*A definir conforme regulamento do Biochallenge Brasil 2026.*
