# Biochallenge Brasil 2026 - SUSpicious Totem

Bem-vindo ao repositório do **SUSpicious Totem**, uma solução inovadora de autoatendimento para Unidades Básicas de Saúde (UBS). Este projeto visa otimizar o fluxo de pacientes, reduzir filas e melhorar a experiência de acolhimento inicial no Sistema Único de Saúde (SUS).

## 🎯 O Projeto

O sistema consiste em um totem interativo posicionado na entrada das UBSs. Ele opera integrado (ou com simulação de integração) ao e-SUS e gerencia:
- **Consultas Agendadas:** Direcionamento rápido do paciente ao consultório.
- **Consultas Espontâneas:** Emissão de senhas e encaminhamento para triagem.
- **Vacinação:** Organização de filas com base na prioridade.
- **Triagem Digital:** Geração de QR Code para pacientes preencherem dados via smartphone, evitando lentidão no totem.

## 🚀 Arquitetura Tecnológica Sugerida (Evolução)

Após uma análise profunda do escopo e da solução técnica inicial (que previa Python/Flask + Vanilla JS), **evoluímos a stack tecnológica** para garantir maior manutenibilidade, performance e uma interface mais fluida (essencial para um totem touch):

* **Backend / Camada de Hardware:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
  * *Motivo:* Python é excelente para integrar com os pinos GPIO do Raspberry Pi e com a impressora térmica. O FastAPI é mais rápido, moderno, seguro (tipagem nativa) e facilita a criação de APIs RESTful em comparação ao Flask.
* **Frontend (Kiosk UI):** [React](https://react.dev/) (criado com Vite) ou [Vue.js](https://vuejs.org/)
  * *Motivo:* Frameworks baseados em componentes permitem criar interfaces complexas, reativas e com animações suaves muito mais rápido do que com HTML/CSS/JS puros. Eles lidam de forma eficiente com o estado da aplicação (ex: senhas chamadas, fluxo de telas).
* **Banco de Dados (Edge / Offline):** [SQLite](https://www.sqlite.org/index.html) com [SQLModel](https://sqlmodel.tiangolo.com/) ou SQLAlchemy
  * *Motivo:* Mantido pela leveza e resiliência offline. O SQLModel traz os princípios do Clean Code diretamente para o banco de dados.

## 🛠 Como Iniciar (Setup de Desenvolvimento)

Consulte o arquivo [ARCHITECTURE.md](./ARCHITECTURE.md) para entender a organização das pastas e os padrões de Clean Code adotados no projeto.

*(Instruções de instalação, `npm install`, `pip install -r requirements.txt`, etc., serão documentadas aqui conforme o desenvolvimento avance).*
