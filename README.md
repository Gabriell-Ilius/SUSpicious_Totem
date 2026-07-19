# Biochallenge Brasil 2026 - SUSpicious Totem

Bem-vindo ao repositório do **SUSpicious Totem**, uma solução inovadora de autoatendimento para Unidades Básicas de Saúde (UBS). Este projeto visa otimizar o fluxo de pacientes, reduzir filas e melhorar a experiência de acolhimento inicial no Sistema Único de Saúde (SUS).

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
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

pip install -r requirements.txt
alembic upgrade head           # Aplica migrações do banco
uvicorn main:app --reload      # Inicia o servidor FastAPI
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # Inicia o servidor de desenvolvimento Vite
```

> **Nota:** No ambiente de desenvolvimento (Windows), a impressora e os pinos GPIO são simulados automaticamente via interfaces mock. Não é necessário ter o Raspberry Pi conectado.

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

## 📄 Licença

*A definir conforme regulamento do Biochallenge Brasil 2026.*
