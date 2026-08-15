#!/bin/bash
# ==============================================================================
#           SUSpicious Totem — Script Mágico de Instalação & Kiosk
#                     Compatível com Raspberry Pi 3B+, 4 e 5
# ==============================================================================
# Executa a configuração completa do Totem:
# - Instalação de pacotes do sistema
# - Proteção do Cartão SD com tmpfs (RAM Disk)
# - Compilação do Frontend e Ambiente Virtual do Backend
# - Regras USB para Impressoras Térmicas ESC/POS
# - Calibração de Touchscreen e drivers de tela oficial 7"
# - Serviços Systemd e Autostart Kiosk em tela cheia
# ==============================================================================

set -e

echo "=========================================================================="
echo "          🚀 INICIANDO INSTALAÇÃO DO SUSPICIOUS TOTEM NO PI"
echo "=========================================================================="

USER_NAME="$(whoami)"
HOME_DIR="$HOME"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📋 Informações do Ambiente:"
echo "   Usuário Atual:     $USER_NAME"
echo "   Pasta do Projeto:  $PROJECT_DIR"
echo ""

# 1. Atualizar e Instalar Pacotes do Sistema
echo "📦 [1/7] Atualizando repositórios e instalando dependências..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nodejs npm chromium-browser unclutter libusb-1.0-0-dev git xdotool xinput || sudo apt install -y chromium

# 2. Configurar tmpfs na Memória RAM (Protege o cartão SD contra escritas excessivas)
echo ""
echo "💾 [2/7] Configurando tmpfs na RAM para proteger o Cartão SD..."
if ! grep -q "tmpfs /var/log" /etc/fstab; then
    echo "tmpfs /var/log tmpfs defaults,noatime,nosuid,mode=0755,size=100m 0 0" | sudo tee -a /etc/fstab
    echo "tmpfs /tmp     tmpfs defaults,noatime,nosuid,size=100m 0 0" | sudo tee -a /etc/fstab
fi

# 3. Configurar Backend (Python Virtualenv + Dependências)
echo ""
echo "🐍 [3/7] Configurando o Backend (FastAPI + SQLModel)..."
cd "$PROJECT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || true
fi
deactivate

# 4. Configurar Frontend (React + Vite Build)
echo ""
echo "⚛️  [4/7] Compilando o Frontend React..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# 5. Configurar Permissões USB para Impressora Térmica
echo ""
echo "🖨️  [5/7] Configurando permissões USB para a Impressora Térmica..."
sudo bash -c 'cat <<EOF > /etc/udev/rules.d/99-escpos.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0202", MODE="0666", GROUP="dialout"
SUBSYSTEM=="usb", ATTR{idVendor}=="0416", ATTR{idProduct}=="5011", MODE="0666", GROUP="dialout"
EOF'
sudo udevadm control --reload-rules && sudo udevadm trigger || true
sudo usermod -aG dialout "$USER_NAME" || true

# 6. Criar Serviços Systemd
echo ""
echo "⚙️  [6/7] Criando serviços systemd para backend..."

BACKEND_DIR="$PROJECT_DIR/backend"
sudo tee /etc/systemd/system/suspicious-totem-backend.service > /dev/null <<EOF
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

sudo systemctl daemon-reload
sudo systemctl enable suspicious-totem-backend.service
sudo systemctl restart suspicious-totem-backend.service

# 7. Configurar Touch Screen e Kiosk Mode
echo ""
echo "🖐️  [7/7] Configurando Touch Screen e Modo Kiosk..."

# Drivers de tela oficial Raspberry Pi
if [ -f /boot/config.txt ]; then
    if ! grep -q "dtoverlay=vc4-kms-v3d" /boot/config.txt; then
        echo "dtoverlay=vc4-kms-v3d" | sudo tee -a /boot/config.txt || true
    fi
    if ! grep -q "dtparam=i2c_arm=on" /boot/config.txt; then
        echo "dtparam=i2c_arm=on" | sudo tee -a /boot/config.txt || true
    fi
fi

# Detectar binário do Chromium
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_BIN="chromium-browser"
else
    CHROMIUM_BIN="chromium"
fi

KIOSK_CMD="$CHROMIUM_BIN --kiosk --noerrdialogs --disable-infobars --disable-translate --check-for-update-interval=31536000 http://localhost:8000"

# Autostart para XDG e LXDE
AUTOSTART_DIR="$HOME/.config/autostart"
LXDE_DIR="$HOME/.config/lxsession/LXDE-pi"
mkdir -p "$AUTOSTART_DIR" "$LXDE_DIR"

cat <<EOF > "$AUTOSTART_DIR/kiosk.desktop"
[Desktop Entry]
Type=Application
Name=SUSpicious Totem Kiosk
Exec=bash -c "sleep 4 && unclutter -idle 0.1 -root & xset s off & xset -dpms & xset s noblank & $KIOSK_CMD"
X-GNOME-Autostart-enabled=true
EOF

cat <<EOF > "$LXDE_DIR/autostart"
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
@bash -c "sleep 4 && $KIOSK_CMD"
EOF

# Criar atalho na Área de Trabalho
DESKTOP_DIR="$HOME/Desktop"
mkdir -p "$DESKTOP_DIR"
cat <<EOF > "$DESKTOP_DIR/Rodar_Totem.sh"
#!/bin/bash
pkill -f chromium 2>/dev/null || true
sleep 1
$KIOSK_CMD &
EOF
chmod +x "$DESKTOP_DIR/Rodar_Totem.sh"

echo ""
echo "=========================================================================="
echo "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================================================="
echo "   Backend Service: suspicious-totem-backend.service"
echo "   Interface URL:   http://localhost:8000"
echo "   Swagger Docs:    http://localhost:8000/docs"
echo ""
echo "🔄 Para iniciar o modo Kiosk completo automaticamente:"
echo "   sudo reboot"
echo "=========================================================================="
