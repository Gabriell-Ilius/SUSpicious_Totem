# Biochallenge Brasil 2026 - SUSpicious Totem

Bem-vindo ao repositório do **SUSpicious Totem**, uma solução inovadora de autoatendimento para Unidades Básicas de Saúde (UBS). Este projeto visa otimizar o fluxo de pacientes, reduzir filas e melhorar a experiência de acolhimento inicial no Sistema Único de Saúde (SUS).

## 👥 Equipe SUSpicious

| Integrante | Instituição |
|:-----------|:------------|
| **Arthur de Paula Dias** | UnB — Universidade de Brasília |
| **Gabriell de Luccas Rego Lourenço** | UnB — Universidade de Brasília |
| **Vinicius Carvalho Lima Alcanfor** | UnB — Universidade de Brasília |

## 🎯 O Projeto

O sistema consiste em um totem interativo posicionado na entrada das UBSs. Ele opera integrado (ou com simulação de integração) ao e-SUS PEC e gerencia:
- **Consultas Agendadas:** Direcionamento rápido do paciente ao consultório.
- **Consultas Espontâneas:** Emissão de senhas e encaminhamento para triagem.
- **Vacinação:** Organização de filas com base na prioridade.
- **Triagem Digital:** Geração de QR Code para pacientes preencherem dados via smartphone, evitando lentidão no totem.

## 🚀 Arquitetura Tecnológica

Após análise profunda do escopo e da solução técnica inicial (que previa Python/Flask + Vanilla JS), **evoluímos a stack tecnológica** para garantir maior manutenibilidade, performance e uma interface mais fluida (essencial para um totem touch):

| Camada | Tecnologia | Motivo |
|:-------|:-----------|:-------|
| **Backend / Hardware** | [FastAPI](https://fastapi.tiangolo.com/) (Python) | Rápido, async nativo, tipagem forte (Pydantic), documentação Swagger automática. Ideal para integrar com GPIO e impressora. |
| **Frontend (Kiosk UI)** | [React](https://react.dev/) (Vite) | Componentização, estado reativo, animações fluidas. Interface responsiva para touchscreen. |
| **Banco de Dados** | [SQLite](https://www.sqlite.org/) + [SQLModel](https://sqlmodel.tiangolo.com/) | Leve, sem servidor, resiliência offline. SQLModel integra tipagem Python com o ORM. |
| **Migrações** | [Alembic](https://alembic.sqlalchemy.org/) | Versionamento do schema do banco. Essencial para evoluir tabelas sem perder dados. |
| **Impressora** | [python-escpos](https://python-escpos.readthedocs.io/) | Padrão da indústria para impressoras térmicas ESC/POS via USB/Serial. |

> 📖 **Detalhes completos da arquitetura, padrões de código e organização de pastas:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## 🛠 Como Rodar Localmente

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Git

### Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # ou venv\Scripts\activate no Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### 📡 Testando Resiliência (Offline-First)
Desligue a rede Wi-Fi ou pare o Backend. O Frontend mostrará um *Badge Vermelho* de Sincronização Pausada, mas continuará emitindo senhas perfeitamente.

### 🖨️ Hardware & Kiosk (Raspberry Pi)

Se você tem um **Raspberry Pi com tela Touch Screen** e quer rodar o Totem fisicamente:

#### Passo a Passo (Deploy Físico)
1. Instale o **Raspberry Pi OS (com Desktop)** no seu MicroSD e conecte a tela touch no Pi.
2. Ligue o Pi, conecte no Wi-Fi, abra o Terminal e clone este repositório.
3. Conecte sua impressora térmica na porta USB do Pi.
4. Execute o nosso script mágico de automação:
   ```bash
   cd SUSpicious_Totem
   bash scripts/setup_kiosk.sh
   ```
5. O script instalará o navegador, desativará a proteção de tela, protegerá o seu SD card transferindo logs para a RAM (`tmpfs`), e criará as regras USB para a impressora.
6. Crie o arquivo `.env` na pasta `backend` contendo `PRINTER_MODE=escpos`.
7. Reinicie o Raspberry Pi. O sistema iniciará automaticamente em tela cheia (Kiosk Mode)!

#### ⚠️ Pendências Futuras (Ajustes Físicos)
Como o hardware exato varia por UBS, as seguintes configurações precisam de sintonia fina antes da entrega final no postinho:
- **Modelo da Impressora:** No arquivo `backend/app/infrastructure/external/escpos_printer.py`, os valores `id_vendor` (0x04b8) e `id_product` (0x0202) representam uma Epson genérica. Eles devem ser trocados pelos IDs reais da impressora comprada (basta rodar `lsusb` no Raspberry Pi para descobrir).
- **Domínio da Triagem:** O QR Code impresso no cupom está apontando para o IP de desenvolvimento local. Ele deverá ser atualizado para o URL público do sistema web da UBS.
- **Credenciais do e-SUS:** A integração offline envia dados para o PEC. As senhas da API do e-SUS devem ser preenchidas no `.env` de produção.

> **Nota:** No ambiente de desenvolvimento (Windows), a impressora é simulada automaticamente via interface mock. Não é necessário ter o Raspberry Pi conectado para programar.

## 🌐 Deploy no Raspberry Pi (Produção)

O totem roda em um Raspberry Pi com tela touchscreen. O navegador Chromium é iniciado em **Kiosk Mode** apontando para o frontend local.

```bash
chromium-browser --kiosk --noerrdialogs --disable-translate http://localhost:5173
```

Consulte a seção **Resiliência do Raspberry Pi** no [ARCHITECTURE.md](./ARCHITECTURE.md) para configurações de produção (RAM disk, reinício automático, IP estático).

## 🤝 Guia de Contribuição

### Branches
| Branch | Uso |
|:-------|:----|
| `main` | Código estável e revisado. Nunca commite diretamente aqui. |
| `develop` | Branch de integração. PRs de features são mergeados aqui. |
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
1. Crie uma branch a partir de `develop`: `git checkout -b feature/nome-da-feature develop`
2. Desenvolva e commite seguindo o padrão acima.
3. Abra um **Pull Request** para `develop`.
4. Após revisão e aprovação, faça o merge.

## 🗺️ Roadmap

Consulte o [ROADMAP.md](./ROADMAP.md) para acompanhar os marcos de desenvolvimento e o progresso do projeto.

## 📄 Licença

*A definir conforme regulamento do Biochallenge Brasil 2026.*
