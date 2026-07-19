# Guia de Arquitetura e Organização de Código (Clean Architecture)

Este documento define como o código do **SUSpicious Totem** será estruturado. Para garantir que o projeto seja escalável, testável e fácil de manter, adotaremos os princípios da **Clean Architecture** (Arquitetura Limpa) e **Clean Code**.

## 💡 Por que mudar a stack original?
A stack original propunha Flask + HTML/JS puro. Para um sistema de totem comercial/produção:
1. **Frontend Reativo:** O usuário de um totem espera respostas imediatas na tela. Usar React ou Vue.js permite componentizar botões de alto contraste, telas de espera e modais com facilidade.
2. **Backend de Alta Performance e Tipado:** O FastAPI substitui o Flask trazendo documentação automática (Swagger), validação de dados nativa (Pydantic) e suporte a requisições assíncronas nativas.
3. **Hardware Isolado:** A comunicação com a impressora e o Raspberry Pi deve ser totalmente isolada das regras de negócio.

## 📂 Estrutura de Diretórios Proposta

O repositório será dividido em duas grandes áreas: `backend` e `frontend`.

```text
SUSpicious_Totem/
│
├── backend/                  # API em Python (FastAPI) e controle de Hardware
│   ├── app/
│   │   ├── core/             # Configurações gerais, segurança, e variáveis de ambiente
│   │   ├── domain/           # Modelos de dados (Entities) puros (ex: Paciente, Fila, Senha)
│   │   ├── application/      # Casos de uso / Regras de negócio (ex: GerarSenha, ValidarCPF)
│   │   ├── infrastructure/   # Implementações técnicas e dependências externas
│   │   │   ├── database/     # Sessões do SQLite, repositórios SQLAlchemy/SQLModel
│   │   │   ├── hardware/     # Scripts de controle GPIO (Raspberry) e Impressora Térmica
│   │   │   └── external/     # Integração com a API do e-SUS (simulação)
│   │   └── api/              # Controllers/Endpoints do FastAPI (Rotas HTTP/REST)
│   ├── tests/                # Testes unitários e de integração
│   ├── main.py               # Ponto de entrada da aplicação FastAPI
│   └── requirements.txt      # Dependências do Python
│
├── frontend/                 # Interface Touchscreen (React/Vite ou Vue)
│   ├── src/
│   │   ├── assets/           # Imagens, ícones, fontes de alto contraste
│   │   ├── components/       # Botões reaproveitáveis, Cards, Teclado Virtual, etc.
│   │   ├── pages/            # Telas completas (Home, InserirCPF, ImprimirSenha, QRCode)
│   │   ├── services/         # Funções para chamar a API local do FastAPI (Axios/Fetch)
│   │   ├── hooks/            # Hooks customizados para gerenciamento de estado
│   │   ├── styles/           # CSS Global e variáveis de design (Cores acessíveis)
│   │   └── App.jsx           # Raiz da UI
│   ├── public/               # Arquivos estáticos e index.html
│   └── package.json          # Dependências do Node/Frontend
│
├── docs/                     # Manuais, diagramas e PDFs do projeto
│
├── README.md                 # Visão geral do projeto
└── ARCHITECTURE.md           # Este arquivo
```

## 📐 Padrões de Clean Architecture a Seguir

### 1. Regra de Dependência
As dependências do código devem apontar **apenas para dentro**. 
- A camada de `domain` não sabe nada sobre o `database` ou a `api`. 
- A camada de `api` (rotas do FastAPI) apenas recebe a requisição HTTP e repassa para a camada de `application` (Casos de Uso).
- O `database` (SQLite) é apenas um detalhe de infraestrutura. 

### 2. Separação do Hardware
O código que aciona a impressora térmica (`Goojprt QR203`) ou lê sinais do Raspberry Pi deve ficar **exclusivamente** na pasta `backend/app/infrastructure/hardware/`. 
Nenhum caso de uso (`application`) deve importar diretamente bibliotecas de hardware. Eles devem usar **interfaces (Abstract Base Classes em Python)**. Isso permite que você teste o sistema inteiro no seu computador Windows, simulando a impressora no terminal, sem precisar do Raspberry Pi conectado.

### 3. Padrão de Repositório (Repository Pattern)
Não faça consultas SQL misturadas com a lógica de negócio. Toda interação com o banco SQLite deve ser feita através de repositórios (ex: `PacienteRepository`), permitindo trocar ou testar o banco de dados facilmente.

## 🧹 Diretrizes de Clean Code (Código Limpo)

1. **Nomes Significativos:** Nomes de variáveis, funções e arquivos devem revelar sua intenção.
   - ❌ *Ruim:* `def p_c(c):` ou `def calc(x):`
   - ✅ *Bom:* `def verificar_cadastro_paciente(cpf: str):` ou `def imprimir_senha(senha: Senha):`
2. **Funções Pequenas:** Uma função deve fazer apenas uma coisa. Se uma função tem mais de 20 linhas, considere dividi-la.
3. **Tratamento de Erros:** Não use blocos genéricos `try...except Exception`. Trate os erros específicos da impressora ou de rede (e-SUS offline) separadamente e retorne mensagens amigáveis para a interface do totem.
4. **Comentários Úteis:** Evite comentários óbvios. Documente o **porquê** de uma decisão técnica, não **o que** o código está fazendo (o próprio código deve ser autoexplicativo).
5. **Tipagem (Type Hints):** Como usaremos FastAPI, abuse dos *Type Hints* nativos do Python. Eles evitam bugs antes mesmo de executar o código.
   ```python
   def gerar_proxima_senha(tipo_atendimento: str) -> str:
       # Lógica
       return senha
   ```

## ♿ Interface e Acessibilidade (Frontend)
No desenvolvimento da interface para o Kiosk:
- Evitar ao máximo campos de digitação (use o fluxo de QR Code para dados complexos).
- Utilizar alto contraste de cores e fontes sem serifa grandes.
- Prevenir zoom ou scroll acidental (comportamento típico de Kiosk Mode no navegador Chromium).
