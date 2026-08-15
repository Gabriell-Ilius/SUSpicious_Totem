# 🏥 Guia Rápido de Testes & Demonstração (Pitch) — SUSpicious Totem

Este guia contém **todos os links, CPFs de teste e o roteiro direto ao ponto** para demonstrar o sistema.

---

## 🔗 1. Links de Acesso Rápido

| Interface | Link Direto | Finalidade |
| :--- | :--- | :--- |
| 🖥️ **Totem Kiosk (Autoatendimento)** | [http://localhost:5173/](http://localhost:5173/) | Tela do paciente (Touchscreen / Teclado USB) |
| 📺 **Painel de Senhas (TV Recepção)** | [http://localhost:5173/painel](http://localhost:5173/painel) | Transmissão de senhas e aviso sonoro hospitalar |
| 📱 **Acesso Celular (Mesmo Wi-Fi)** | `http://192.168.15.34:5173/` | Para abrir no celular via QR Code ou navegador |
| 📄 **Documentação Swagger (API)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Endpoints REST e Swagger interativo |

---

## 👥 2. Tabela de CPFs com Agendamento Hoje (e-SUS APS)

Todos estes CPFs possuem consultas válidas para o dia de **HOJE** e são fáceis de digitar:

| Digite no Totem | Nome do Paciente | Especialidade / Destino | Médico(a) |
| :--- | :--- | :--- | :--- |
| `11111111111` | **João da Silva Santos (Demo)** | Clínica Geral • **Consultório 02** | Dra. Camila Rocha |
| `22222222222` | **Maria Aparecida Lima** | Cardiologia • **Consultório 03** | Dr. Roberto Alves |
| `33333333333` | **Carlos Eduardo Pereira** | Pediatria • **Consultório 04** | Dr. Carlos Souza |
| `44444444444` | **Ana Paula Fernandes** | Saúde da Mulher • **Consultório 01** | Dra. Ana Costa |
| `55555555555` | **Sr. Antonio Gomes (80+)** | Geriatria • **Consultório 05** | Dr. Marcos Vinicius |
| `12345678900` | **Juliana Martins Costa** | Clínica Geral • **Consultório 01** | Dra. Ana Costa |
| `98765432100` | **Lucas Henrique Souza** | Odontologia • **Consultório 04** | Dr. Carlos Souza |
| `11122233344` | **Francisca Rodrigues** | Enfermagem • **Consultório 02** | Dra. Camila Rocha |

> 💡 **Dica de Teste Sem Agendamento:**  
> Digite qualquer outro CPF (ex: `00000000000`) ou clique no botão **"Não Sei / Pular CPF"** para abrir a grade dos 4 serviços do posto:
> 1. *Consulta Espontânea (Acolhimento)*
> 2. *Consulta Agendada*
> 3. *Vacinação / Imunização*
> 4. *Farmácia Básica*

---

## 🎬 3. Roteiro de Demonstração de 2 Minutos (Para o Pitch)

### Passo 1: Preparar as Telas
- Abra o **Totem** em: [http://localhost:5173/](http://localhost:5173/)
- Abra a **TV de Senhas** em outra aba/janela: [http://localhost:5173/painel](http://localhost:5173/painel)
- No rodapé do painel, clique em **`[ 🗑️ Zerar Fila (Pitch Demo) ]`** para começar limpo com 0 pacientes.

### Passo 2: Testar Paciente com Horário Marcado (CPF Fácil)
1. Na tela do Totem, digite `11111111111` no teclado numérico grande e clique em **"Confirmar CPF"**;
2. O Totem reconhece na hora: *"Consulta Confirmada! João da Silva Santos — Dirija-se ao Consultório 02"*;
3. Na impressora/terminal sai o comprovante e na tela estampa o **QR Code gigante de 220px**.

### Passo 3: Testar Paciente Sem Horário (Acolhimento / Vacina)
1. No Totem, clique em **"Não Sei / Pular CPF"**;
2. Escolha **"Consulta Espontânea"**;
3. Selecione **"Atendimento Preferencial"** e marque a opção desejada (*Gestante, 80+, PCD ou TEA*);
4. Clique em **"Confirmar e Emitir Senha"** (gera a senha `ESP-P001`).

### Passo 4: Escanear o QR Code no Celular (Pré-Triagem)
1. Com a câmera do celular conectado ao Wi-Fi, aponte para o QR Code da tela;
2. O formulário de **Pré-Triagem do e-SUS** abre no celular;
3. Preencha a queixa, a escala de dor (0 a 10) e role até o final para clicar em **"Enviar Avaliação"**;
4. O formulário confirma o envio para a mesa do enfermeiro.

### Passo 5: Chamar a Senha na TV
1. Na tela do **Painel de Senhas**, veja que a nova senha já está listada em tempo real na fila;
2. Clique no botão **`[ 🔔 Chamar Próxima Senha da Fila ]`**;
3. A TV toca o sinal sonoro hospitalar *"Ding-Dong"* e estampa a senha gigante com o consultório e o nome em destaque dourado!
