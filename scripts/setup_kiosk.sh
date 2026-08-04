#!/bin/bash

# ==============================================================================
# SUSpicious Totem - Script de Instalação e Deploy Automático (Raspberry Pi 3B+)
# Executa a configuração do Kiosk Mode, Impressora USB ESC/POS e Serviços Systemd
# ==============================================================================

set -e

# Detectar diretório do script e diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
USER_NAME="$(whoami)"

echo ""
echo "🚀 =================================================================="
echo "   SUSpicious Totem - Instalação Automática no Raspberry Pi 3B+"
echo "   Projeto: $PROJECT_DIR"
echo "   Usuário: $USER_NAME"
echo "=================================================================="
echo ""

# ==============================================================================
# 1. Atualizar repositórios e instalar pacotes essenciais
# ==============================================================================
echo "📦 [1/7] Atualizando o sistema e instalando pacotes..."
sudo apt update
sudo apt install -y \
    python3-pip python3-venv \
    nodejs npm \
    unclutter \
    libusb-1.0-0-dev git \
    xdotool xdg-utils || true

# Instalar Chromium (o nome do pacote varia entre versões do Raspberry Pi OS)
if ! command -v chromium-browser &> /dev/null && ! command -v chromium &> /dev/null; then
    echo "   Instalando Chromium..."
    sudo apt install -y chromium-browser || sudo apt install -y chromium || true
fi

# Instalar 'serve' globalmente para servir o frontend como SPA
echo "   Instalando servidor estático 'serve' para o frontend..."
sudo npm install -g serve || true

# ==============================================================================
# 2. Configurar ambiente do Backend Python
# ==============================================================================
echo ""
echo "🐍 [2/7] Configurando ambiente virtual Python e dependências do Backend..."
cd "$PROJECT_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Criar arquivo .env com valores padrão (se não existir)
if [ ! -f .env ]; then
    echo "   Criando arquivo .env com modo MOCK..."
    cp .env.example .env 2>/dev/null || cat > .env <<'ENVEOF'
PROJECT_NAME="SUSpicious Totem"
PRINTER_MODE=mock
PRINTER_VENDOR_ID=0x04b8
PRINTER_PRODUCT_ID=0x0202
DATABASE_URL=sqlite:///./suspicious_totem.db
ESUS_API_URL=https://exemplo-esus-ubs.gov.br/api
ESUS_API_TOKEN=token_exemplo_desenvolvimento
ENVEOF
fi

# ==============================================================================
# 3. Configurar Frontend React (Vite)
# ==============================================================================
echo ""
echo "⚛️  [3/7] Instalando dependências e compilando o Frontend..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# ==============================================================================
# 4. Configurar regras udev USB para a Impressora Térmica
# ==============================================================================
echo ""
echo "🖨️  [4/7] Configurando permissões USB para a Impressora Térmica ESC/POS..."
sudo bash -c 'cat <<EOF > /etc/udev/rules.d/99-escpos.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0202", MODE="0666", GROUP="dialout"
SUBSYSTEM=="usb", ATTR{idVendor}=="0416", ATTR{idProduct}=="5011", MODE="0666", GROUP="dialout"
EOF'
sudo udevadm control --reload-rules && sudo udevadm trigger || true

# Adicionar o usuário ao grupo dialout (necessário para acessar USB)
sudo usermod -aG dialout "$USER_NAME" || true

# ==============================================================================
# 5. Criar Serviços Systemd (início automático no boot)
# ==============================================================================
echo ""
echo "⚙️  [5/7] Criando serviços systemd para backend e frontend..."

BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
SERVE_BIN="$(which serve 2>/dev/null || echo '/usr/local/bin/serve')"

# --- Serviço do Backend FastAPI (Porta 8000) ---
sudo tee /etc/systemd/system/suspicious-backend.service > /dev/null <<EOF
[Unit]
Description=Backend FastAPI - SUSpicious Totem
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF

# --- Serviço do Frontend (serve -s dist na Porta 5173) ---
# Usa 'serve' em vez de 'python3 -m http.server' para suportar SPAs corretamente
sudo tee /etc/systemd/system/suspicious-frontend.service > /dev/null <<EOF
[Unit]
Description=Frontend Kiosk UI - SUSpicious Totem
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$FRONTEND_DIR
ExecStart=$SERVE_BIN -s dist -l 5173
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Registrar e iniciar os serviços
sudo systemctl daemon-reload
sudo systemctl enable suspicious-backend.service suspicious-frontend.service
sudo systemctl restart suspicious-backend.service suspicious-frontend.service

echo "   ✅ Backend: $(systemctl is-active suspicious-backend.service)"
echo "   ✅ Frontend: $(systemctl is-active suspicious-frontend.service)"

# ==============================================================================
# 6. Configurar Touch Screen
# ==============================================================================
echo ""
echo "🖐️  [6/7] Configurando Touch Screen..."

# Calibração do touchscreen (usa xinput se disponível)
# Detecta se há um dispositivo de toque e o configura
TOUCH_DEVICE=$(xinput list --name-only 2>/dev/null | grep -i "touch\|ft5\|eGalax\|wch\|Goodix\|raspi" | head -1 || true)
if [ -n "$TOUCH_DEVICE" ]; then
    echo "   Dispositivo Touch detectado: $TOUCH_DEVICE"
    # Mapeia o touchscreen à tela principal
    xinput map-to-output "$TOUCH_DEVICE" "$(xrandr --listmonitors 2>/dev/null | tail -1 | awk '{print $NF}')" 2>/dev/null || true
else
    echo "   ⚠️  Nenhum touchscreen detectado automaticamente."
    echo "      Se o toque não funcionar, verifique:"
    echo "      - A tela está conectada corretamente ao GPIO/USB?"
    echo "      - Execute 'xinput list' para ver os dispositivos de entrada."
    echo "      - Talvez seja necessário instalar drivers específicos."
fi

# Configuração do driver touchscreen no /boot/config.txt (oficial Raspberry Pi 7")
# Verifica se já está configurado para evitar duplicatas
if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/config.txt 2>/dev/null; then
    echo "   Adicionando suporte a overlay de vídeo..."
    sudo bash -c 'echo "dtoverlay=vc4-kms-v3d" >> /boot/config.txt' || true
fi

# Para a tela oficial do Raspberry Pi (DSI), garantir que o touchscreen está habilitado
if ! grep -q "dtparam=i2c_arm=on" /boot/config.txt 2>/dev/null; then
    sudo bash -c 'echo "dtparam=i2c_arm=on" >> /boot/config.txt' || true
fi

# ==============================================================================
# 7. Configurar Kiosk Mode (Chromium em tela cheia + desligar proteção de tela)
# ==============================================================================
echo ""
echo "🖥️  [7/7] Configurando Kiosk Mode (Chromium em tela cheia)..."

# Detectar o binário do Chromium
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_BIN="chromium-browser"
elif command -v chromium &> /dev/null; then
    CHROMIUM_BIN="chromium"
else
    echo "   ⚠️  Chromium não encontrado! Instalando..."
    sudo apt install -y chromium-browser || sudo apt install -y chromium
    CHROMIUM_BIN="chromium-browser"
fi

# Detectar pasta da Área de Trabalho
DESKTOP_DIR="$HOME/Desktop"
if [ -d "$HOME/Área de Trabalho" ]; then
    DESKTOP_DIR="$HOME/Área de Trabalho"
elif [ -d "$HOME/Área de trabalho" ]; then
    DESKTOP_DIR="$HOME/Área de trabalho"
fi
mkdir -p "$DESKTOP_DIR"

# Flags do Chromium para modo kiosk
KIOSK_FLAGS="--kiosk --noerrdialogs --disable-infobars --disable-translate --check-for-update-interval=31536000 --disable-features=TranslateUI --autoplay-policy=no-user-gesture-required http://localhost:5173"

FULL_KIOSK_CMD="$CHROMIUM_BIN $KIOSK_FLAGS"

# --- Criar diretórios de autostart ---
AUTOSTART_DIR="$HOME/.config/autostart"
LXDE_DIR="$HOME/.config/lxsession/LXDE-pi"
mkdir -p "$AUTOSTART_DIR" "$LXDE_DIR"

# --- Autostart XDG padrão (para PIXEL desktop) ---
cat <<EOF > "$AUTOSTART_DIR/kiosk.desktop"
[Desktop Entry]
Type=Application
Name=SUSpicious Totem Kiosk
Exec=bash -c "sleep 5 && unclutter -idle 0.1 -root & xset s off & xset -dpms & xset s noblank & $FULL_KIOSK_CMD"
X-GNOME-Autostart-enabled=true
EOF

# --- Autostart LXDE-pi tradicional (Raspberry Pi OS padrão) ---
cat <<EOF > "$LXDE_DIR/autostart"
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
@bash -c "sleep 5 && $FULL_KIOSK_CMD"
EOF

# --- Atalho rápido na área de trabalho para testes manuais ---
cat <<EOF > "$DESKTOP_DIR/Rodar_Totem.sh"
#!/bin/bash
# Script rápido para testar o Totem manualmente
# Mata instâncias anteriores do Chromium e abre em modo kiosk
pkill -f chromium 2>/dev/null || true
sleep 1
$FULL_KIOSK_CMD &
EOF
chmod +x "$DESKTOP_DIR/Rodar_Totem.sh"

# --- Desabilitar proteção de tela e screensaver ---
# lightdm.conf: desabilitar sleep/screensaver
if [ -f /etc/lightdm/lightdm.conf ]; then
    if ! grep -q "xserver-command" /etc/lightdm/lightdm.conf; then
        sudo sed -i '/^\[Seat:\*\]/a xserver-command=X -s 0 -dpms' /etc/lightdm/lightdm.conf || true
    fi
fi

# ==============================================================================
# RESULTADO FINAL
# ==============================================================================
echo ""
echo "=========================================================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================================================="
echo ""
echo "📋 Resumo:"
echo "   Navegador Detectado:  [$CHROMIUM_BIN]"
echo "   Backend Service:      suspicious-backend.service"
echo "   Frontend Service:     suspicious-frontend.service"
echo "   Frontend URL:         http://localhost:5173"
echo "   Backend API (Swagger):http://localhost:8000/docs"
echo "   Pasta Desktop:        [$DESKTOP_DIR]"
echo ""
echo "🧪 Para testar AGORA (sem reiniciar):"
echo "   1. Verifique os services:"
echo "      systemctl status suspicious-backend.service"
echo "      systemctl status suspicious-frontend.service"
echo "   2. Abra o navegador manualmente:"
echo "      $CHROMIUM_BIN --kiosk http://localhost:5173"
echo "   3. Ou clique em '$DESKTOP_DIR/Rodar_Totem.sh'"
echo ""
echo "🔄 Para ativar tudo automaticamente no boot:"
echo "   sudo reboot"
echo ""
echo "🖐️  Se o TOUCH não funcionar após o reboot, execute:"
echo "   xinput list                    (ver dispositivos de entrada)"
echo "   xinput map-to-output <ID> <DISPLAY>  (mapear touch à tela)"
echo ""
echo "=========================================================================="
