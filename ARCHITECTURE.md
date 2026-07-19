# Guia de Arquitetura e Organização de Código (Clean Architecture)

Este documento define como o código do **SUSpicious Totem** será estruturado. Para garantir que o projeto seja escalável, testável e fácil de manter, adotaremos os princípios da **Clean Architecture** (Arquitetura Limpa) e **Clean Code**.

---

## 💡 Por que mudar a stack original?

A stack original propunha Flask + HTML/JS puro. Para um sistema de totem comercial/produção:

1. **Frontend Reativo:** O usuário de um totem espera respostas imediatas na tela. Usar React permite componentizar botões de alto contraste, telas de espera e modais com facilidade.
2. **Backend de Alta Performance e Tipado:** O FastAPI substitui o Flask trazendo documentação automática (Swagger), validação de dados nativa (Pydantic) e suporte a requisições assíncronas nativas — essencial para não travar a fila enquanto a impressora imprime ou o e-SUS responde.
3. **Hardware Isolado:** A comunicação com a impressora e o Raspberry Pi deve ser totalmente isolada das regras de negócio, permitindo desenvolver e testar no Windows sem hardware.

---

## 📂 Estrutura de Diretórios

O repositório é dividido em duas grandes áreas: `backend` e `frontend`.

```text
SUSpicious_Totem/
│
├── backend/                      # API em Python (FastAPI) e controle de Hardware
│   ├── app/
│   │   ├── core/                 # Configurações, variáveis de ambiente (Pydantic BaseSettings)
│   │   │   ├── config.py         # Carrega .env com BaseSettings
│   │   │   └── security.py       # Credenciais e-SUS, tokens
│   │   │
│   │   ├── domain/               # Modelos de dados (Entities) puros — ZERO dependências externas
│   │   │   ├── paciente.py       # Entidade Paciente (CPF, nome, CNS)
│   │   │   ├── senha.py          # Entidade Senha (código, tipo, prioridade, timestamp)
│   │   │   └── fila.py           # Entidade Fila (tipo de atendimento, posições)
│   │   │
│   │   ├── application/          # Casos de uso / Regras de negócio
│   │   │   ├── gerar_senha.py    # UseCase: gerar próxima senha da fila
│   │   │   ├── validar_cpf.py    # UseCase: validar e buscar paciente
│   │   │   ├── chamar_senha.py   # UseCase: chamar próxima senha no painel
│   │   │   └── ports/            # Interfaces abstratas (ABC) para inversão de dependência
│   │   │       ├── printer_port.py
│   │   │       ├── paciente_repository_port.py
│   │   │       └── esus_gateway_port.py
│   │   │
│   │   ├── infrastructure/       # Implementações técnicas e dependências externas
│   │   │   ├── database/         # Sessões do SQLite, repositórios concretos (SQLModel)
│   │   │   │   ├── session.py    # Engine SQLite + check_same_thread=False
│   │   │   │   └── paciente_repository.py  # Implementa PacienteRepositoryPort
│   │   │   │
│   │   │   ├── hardware/         # Controle GPIO (Raspberry) e Impressora Térmica
│   │   │   │   ├── escpos_printer.py       # Implementa PrinterPort com python-escpos
│   │   │   │   └── mock_printer.py         # Implementa PrinterPort para dev (print no terminal)
│   │   │   │
│   │   │   └── external/         # Integração com API do e-SUS PEC (LEDI APS)
│   │   │       ├── esus_gateway.py         # Implementa EsusGatewayPort (requisições HTTPS)
│   │   │       └── mock_esus_gateway.py    # Simulação offline para desenvolvimento
│   │   │
│   │   └── api/                  # Controllers / Endpoints do FastAPI (Rotas REST)
│   │       ├── router_senha.py   # POST /senhas, GET /senhas/proxima
│   │       ├── router_paciente.py
│   │       └── router_fila.py
│   │
│   ├── alembic/                  # Migrações de banco de dados
│   │   ├── versions/             # Arquivos de migração gerados
│   │   └── env.py                # Configuração do Alembic (target_metadata)
│   ├── alembic.ini               # Config principal do Alembic
│   ├── tests/                    # Testes unitários e de integração
│   │   ├── unit/                 # Testa application/ isoladamente (tudo mockado)
│   │   ├── integration/          # Testa infrastructure/ com SQLite in-memory
│   │   └── conftest.py           # Fixtures compartilhadas (pytest)
│   ├── .env.example              # Template de variáveis de ambiente (sem valores reais)
│   ├── main.py                   # Ponto de entrada da aplicação FastAPI
│   └── requirements.txt          # Dependências do Python
│
├── frontend/                     # Interface Touchscreen (React / Vite)
│   ├── src/
│   │   ├── assets/               # Imagens, ícones, fontes de alto contraste
│   │   ├── components/           # Botões reaproveitáveis, Cards, Teclado Virtual, etc.
│   │   ├── pages/                # Telas completas (Home, InserirCPF, ImprimirSenha, QRCode)
│   │   ├── services/             # Funções para chamar a API local do FastAPI (Axios/Fetch)
│   │   ├── hooks/                # Hooks customizados para gerenciamento de estado
│   │   ├── styles/               # CSS Global e variáveis de design (Cores acessíveis)
│   │   └── App.jsx               # Raiz da UI
│   ├── public/                   # Arquivos estáticos, service-worker.js (PWA)
│   └── package.json              # Dependências do Node/Frontend
│
├── docs/                         # Manuais, diagramas e PDFs do projeto
│   └── PDF/                      # Documentos originais do Biochallenge
│
├── .gitignore                    # Regras de exclusão do Git
├── README.md                     # Visão geral do projeto
└── ARCHITECTURE.md               # Este arquivo
```

---

## 📐 Padrões de Clean Architecture

### 1. Regra de Dependência (Dependency Rule)

As dependências do código devem apontar **apenas para dentro** (das camadas externas para as internas).

```
[api] → [application] → [domain]
                ↑
        [infrastructure]
```

- A camada de `domain/` não sabe nada sobre o `database` ou a `api`.
- A camada de `application/` define **interfaces abstratas** (Ports) que a `infrastructure/` implementa.
- A camada de `api/` (rotas do FastAPI) apenas recebe a requisição HTTP e repassa para os Casos de Uso.
- O `database` (SQLite) é apenas um detalhe de infraestrutura, substituível sem tocar nas regras de negócio.

### 2. Separação do Hardware (Ports & Adapters)

O código que aciona a impressora térmica (`Goojprt QR203`) ou lê sinais do Raspberry Pi deve ficar **exclusivamente** na pasta `backend/app/infrastructure/hardware/`.

Nenhum caso de uso (`application/`) deve importar diretamente bibliotecas de hardware. Eles devem usar **interfaces abstratas (Abstract Base Classes)**:

```python
# backend/app/application/ports/printer_port.py
from abc import ABC, abstractmethod

class PrinterPort(ABC):
    @abstractmethod
    def imprimir_senha(self, codigo: str, tipo: str) -> None:
        """Imprime uma senha na impressora térmica."""
        ...
```

```python
# backend/app/infrastructure/hardware/escpos_printer.py (PRODUÇÃO - Raspberry Pi)
from escpos.printer import Usb
from app.application.ports.printer_port import PrinterPort

class EscPosPrinter(PrinterPort):
    def imprimir_senha(self, codigo: str, tipo: str) -> None:
        p = Usb(0x0416, 0x5011)  # Vendor/Product ID da Goojprt QR203
        p.text(f"SENHA: {codigo}\nTipo: {tipo}\n")
        p.cut()
```

```python
# backend/app/infrastructure/hardware/mock_printer.py (DESENVOLVIMENTO - Windows)
from app.application.ports.printer_port import PrinterPort

class MockPrinter(PrinterPort):
    def imprimir_senha(self, codigo: str, tipo: str) -> None:
        print(f"[MOCK PRINTER] Senha: {codigo} | Tipo: {tipo}")
```

> **Benefício:** Você testa o sistema inteiro no Windows, simulando a impressora no terminal, sem precisar do Raspberry Pi.

### 3. Padrão de Repositório (Repository Pattern)

Não faça consultas SQL misturadas com a lógica de negócio. Toda interação com o banco SQLite deve ser feita através de repositórios:

```python
# Porta (interface abstrata)
class PacienteRepositoryPort(ABC):
    @abstractmethod
    def buscar_por_cpf(self, cpf: str) -> Paciente | None: ...

# Implementação concreta (infrastructure)
class PacienteRepository(PacienteRepositoryPort):
    def buscar_por_cpf(self, cpf: str) -> Paciente | None:
        return self.session.query(PacienteModel).filter_by(cpf=cpf).first()
```

---

## 🔄 Migrações de Banco de Dados (Alembic)

O Alembic garante que mudanças no schema do banco (ex: adicionar campo `prioridade` na tabela `Senha`) sejam aplicadas de forma segura, **sem perder dados existentes**.

### Fluxo de Trabalho

```bash
# 1. Altere os modelos em domain/ ou infrastructure/database/
# 2. Gere a migração automaticamente:
alembic revision --autogenerate -m "adiciona campo prioridade em senha"

# 3. REVISE o arquivo gerado em alembic/versions/ antes de aplicar!

# 4. Aplique a migração:
alembic upgrade head
```

### ⚠️ Regra Especial para SQLite

O SQLite não suporta `ALTER TABLE` nativamente para a maioria das operações. **Sempre use `batch_alter_table`** nas migrações:

```python
# Dentro do arquivo de migração gerado
def upgrade():
    with op.batch_alter_table('senhas') as batch_op:
        batch_op.add_column(sa.Column('prioridade', sa.Integer(), default=0))
```

### Regras
- **Nunca** use `Base.metadata.create_all()` em produção. Use Alembic.
- **Sempre** commite os arquivos de migração (`alembic/versions/`) no Git.
- **Nunca** commite o arquivo `.db` ou `.sqlite3` (está no `.gitignore`).

---

## 📡 Estratégia Offline-First

O totem será instalado em UBSs onde a internet pode cair a qualquer momento. O sistema **deve funcionar 100% offline** para as operações essenciais (gerar senha, chamar fila, imprimir).

### Princípios

1. **SQLite é a fonte primária de verdade.** O totem grava tudo localmente primeiro.
2. **IDs únicos universais (UUID).** Todas as entidades (Senha, Paciente, Fila) usam `uuid4` como ID primário para evitar colisões quando os dados forem sincronizados com o e-SUS.
3. **UI Otimista.** O frontend mostra "Senha gerada com sucesso" imediatamente, sem esperar resposta do e-SUS.
4. **Motor de sincronização em background.** Um serviço separado no backend tenta enviar os dados registrados para a API do e-SUS periodicamente. Se falhar, tenta novamente mais tarde (fila de retry com backoff exponencial).

### Frontend como PWA

O frontend React será configurado como **Progressive Web App (PWA)** com Service Worker:
- O shell da aplicação (HTML/JS/CSS) é cacheado localmente.
- Mesmo que o Raspberry Pi reinicie e perca o cache do Chromium, a aplicação carrega instantaneamente.

### Integração com e-SUS PEC

A integração com o e-SUS utiliza o padrão **LEDI APS** (Layout de Estrutura de Dados e Intercâmbio) via API REST.

- A comunicação **deve** ser feita via **HTTPS** (requisito oficial do PEC a partir da versão 5.3.19).
- As credenciais de API são geradas no PEC (menu "Transmissão de dados" → "Credenciais para API") e **exibidas uma única vez**. Devem ser armazenadas com segurança no `.env`.
- O repositório oficial de exemplos de integração está em: [github.com/esusab/integracao](https://github.com/esusab/integracao).

---

## 🔐 Variáveis de Ambiente e Segurança

Todas as configurações sensíveis são carregadas de um arquivo `.env` via **Pydantic BaseSettings**.

```python
# backend/app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./suspicious.db"
    ESUS_API_URL: str = "https://localhost:443"
    ESUS_API_USER: str
    ESUS_API_PASSWORD: str
    PRINTER_MODE: str = "mock"     # "mock" para dev, "escpos" para produção
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
```

### Regras de Segurança
- **Nunca** commite o arquivo `.env` (está no `.gitignore`).
- Mantenha um `.env.example` com as chaves (sem valores reais) para referência.
- As credenciais do e-SUS PEC devem ser tratadas como **dados sensíveis de saúde (LGPD)**.

---

## 🖨️ Impressora Térmica (Goojprt QR203)

### Biblioteca: `python-escpos`

```bash
pip install python-escpos
```

### Boas Práticas de Hardware

| Prática | Motivo |
|:--------|:-------|
| Usar **fonte de alimentação externa** para a impressora | A USB do Raspberry Pi não fornece corrente suficiente. Impressoras térmicas têm picos de consumo que podem causar reboot do Pi. |
| Configurar regras **udev** no Raspberry Pi | Evita erros de "Permission Denied" ao acessar a impressora USB sem `sudo`. |
| Preferir conexão **USB** sobre Serial/TTL | Mais estável e plug-and-play. Serial requer cuidado com voltagem (3.3V vs 5V/12V). |
| Usar a **interface abstrata** `PrinterPort` | Permite testar no Windows com `MockPrinter` sem hardware. |

### Regra `udev` (Raspberry Pi)
```bash
# /etc/udev/rules.d/99-thermal-printer.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="0416", ATTR{idProduct}=="5011", MODE="0666"
```

Após criar o arquivo, recarregue as regras:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

---

## 🧹 Diretrizes de Clean Code (Código Limpo)

1. **Nomes Significativos:** Nomes de variáveis, funções e arquivos devem revelar sua intenção.
   - ❌ *Ruim:* `def p_c(c):` ou `def calc(x):`
   - ✅ *Bom:* `def verificar_cadastro_paciente(cpf: str):` ou `def imprimir_senha(senha: Senha):`

2. **Funções Pequenas:** Uma função deve fazer apenas uma coisa. Se uma função tem mais de 20 linhas, considere dividi-la.

3. **Tratamento de Erros:** Não use blocos genéricos `try...except Exception`. Trate erros específicos:
   ```python
   # ❌ Ruim
   try:
       impressora.imprimir(senha)
   except Exception:
       pass

   # ✅ Bom
   try:
       impressora.imprimir(senha)
   except USBError as e:
       logger.error(f"Impressora desconectada: {e}")
       raise PrinterOfflineError("Impressora não encontrada. Verifique a conexão USB.")
   except TimeoutError:
       logger.warning("Timeout ao imprimir. Tentando novamente...")
       impressora.reconectar()
   ```

4. **Comentários Úteis:** Evite comentários óbvios. Documente o **porquê** de uma decisão técnica, não **o que** o código está fazendo.

5. **Tipagem (Type Hints):** Abuse dos *Type Hints* nativos do Python. Eles evitam bugs antes mesmo de executar o código.
   ```python
   def gerar_proxima_senha(tipo_atendimento: str) -> str:
       ...
   ```

---

## 🧪 Estratégia de Testes

| Tipo | Pasta | O que testa | Banco/Hardware |
|:-----|:------|:------------|:---------------|
| **Unitário** | `tests/unit/` | Casos de uso (`application/`) | Tudo mockado (sem banco, sem impressora) |
| **Integração** | `tests/integration/` | Repositórios (`infrastructure/database/`) | SQLite **in-memory** |
| **E2E** | `tests/e2e/` (futuro) | Fluxo completo via API | SQLite in-memory + MockPrinter |

### Ferramentas
- **pytest** + **pytest-asyncio** (FastAPI é assíncrono)
- **httpx** (client de testes para FastAPI)

### Executar Testes
```bash
cd backend
pytest tests/ -v
```

---

## ♿ Interface e Acessibilidade (Frontend)

No desenvolvimento da interface para o Kiosk:
- Evitar ao máximo campos de digitação (use o fluxo de QR Code para dados complexos).
- Utilizar alto contraste de cores e fontes sem serifa grandes (mínimo 18px).
- Prevenir zoom ou scroll acidental (comportamento típico de Kiosk Mode no Chromium).
- Timeout de inatividade: após 60 segundos sem interação, voltar à tela inicial automaticamente.

---

## 🩺 Resiliência do Raspberry Pi (Produção)

Um totem em UBS vai rodar 24/7. Abaixo, as configurações essenciais para estabilidade:

### Proteção do Cartão SD
O cartão SD tem vida útil limitada por escritas. Mova dados temporários para RAM:

```bash
# /etc/fstab — Adicionar estas linhas:
tmpfs /tmp tmpfs defaults,noatime,nosuid,size=100m 0 0
tmpfs /var/log tmpfs defaults,noatime,nosuid,size=50m 0 0
```

### Reinício Automático do Navegador
Chromium em sessões longas acumula memory leaks. Reinicie diariamente:

```bash
# Crontab (crontab -e)
0 3 * * * pkill chromium && sleep 5 && DISPLAY=:0 chromium-browser --kiosk http://localhost:5173 &
```

### Tela Sempre Ativa
```bash
# Desabilitar screen saver e DPMS
xset s off
xset -dpms
xset s noblank
```

### Rede
- Configurar **IP estático** para evitar perda de conexão por DHCP.
- Habilitar **SSH** para manutenção remota.
- Caso o Wi-Fi caia, o totem continua operando 100% offline (estratégia Offline-First).
