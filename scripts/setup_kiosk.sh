#!/bin/bash

# ==============================================================================
# SUSpicious Totem - Script de Instalação e Deploy Automático (Raspberry Pi 3B+)
# Executa a configuração do Kiosk Mode, Impressora USB ESC/POS e Serviços Systemd
# ==============================================================================

set -e

echo "🚀 Iniciando a configuração automática do SUSpicious Totem no Raspberry Pi..."

# 1. Atualizar repositórios e instalar pacotes essenciais
echo "📦 1/6: Instalando pacotes do sistema (Python, Node, Chromium, Unclutter)..."
sudo apt update
sudo apt install -y python3-pip python3-venv nodejs npm chromium chromium-browser unclutter libusb-1.0-0-dev git || sudo apt install -y chromium unclutter

# 2. Configurar ambiente do Backend Python
echo "🐍 2/6: Configurando ambiente virtual Python e dependências do Backend..."
cd "$(dirname "$0")/../backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Configurar arquivo .env para modo de impressora simulada (Mock)
if [ ! -f .env ]; then
    echo "PRINTER_MODE=mock" > .env
    echo "DATABASE_URL=sqlite:///./suspicious_totem.db" >> .env
fi

# 3. Configurar Frontend React (Vite)
echo "⚡ 3/6: Instalando dependências e compilando o Frontend..."
cd "../frontend"
npm install
npm run build

# 4. Configurar regras udev USB para a Impressora Térmica
echo "🖨️  4/6: Configurando permissões USB para a Impressora Térmica ESC/POS..."
sudo bash -c 'cat <<EOF > /etc/udev/rules.d/99-escpos.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="04b8", ATTR{idProduct}=="0202", MODE="0666", GROUP="dialout"
SUBSYSTEM=="usb", ATTR{idVendor}=="0416", ATTR{idProduct}=="5011", MODE="0666", GROUP="dialout"
EOF'
sudo udevadm control --reload-rules && sudo udevadm trigger || true

# 5. Criar Serviços Systemd para o Backend e Frontend (Início Automático no Boot)
echo "⚙️  5/6: Criando serviços de boot automático (Backend + Frontend)..."
WORKING_DIR_BACKEND="$(cd "$(dirname "$0")/../backend" && pwd)"
WORKING_DIR_FRONTEND="$(cd "$(dirname "$0")/../frontend" && pwd)"
USER_NAME="$(whoami)"

# Serviço do Backend FastAPI (Porta 8000)
sudo bash -c "cat <<EOF > /etc/systemd/system/suspicious-backend.service
[Unit]
Description=Backend FastAPI - SUSpicious Totem
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$WORKING_DIR_BACKEND
ExecStart=$WORKING_DIR_BACKEND/venv/bin/python main.py
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF"

# Serviço do Frontend React (Porta 5173)
sudo bash -c "cat <<EOF > /etc/systemd/system/suspicious-frontend.service
[Unit]
Description=Frontend Kiosk UI - SUSpicious Totem
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$WORKING_DIR_FRONTEND
ExecStart=/usr/bin/python3 -m http.server 5173 --directory $WORKING_DIR_FRONTEND/dist
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable suspicious-backend.service suspicious-frontend.service
sudo systemctl restart suspicious-backend.service suspicious-frontend.service

# 6. Detectar executável do Chromium e diretório da Área de Trabalho
echo "🖥️  6/6: Configurando inicialização em Tela Cheia Touch (Kiosk Mode)..."

# Identifica se o comando do navegador é 'chromium' ou 'chromium-browser'
if command -v chromium &> /dev/null; then
    CHROMIUM_BIN="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROMIUM_BIN="chromium-browser"
else
    CHROMIUM_BIN="chromium"
fi

# Identifica a pasta da Área de Trabalho (Desktop ou Área de Trabalho em PT-BR)
DESKTOP_DIR="$HOME/Desktop"
if [ -d "$HOME/Área de Trabalho" ]; then
    DESKTOP_DIR="$HOME/Área de Trabalho"
elif [ -d "$HOME/Área de trabalho" ]; then
    DESKTOP_DIR="$HOME/Área de trabalho"
fi
mkdir -p "$DESKTOP_DIR"

AUTOSTART_DIR="$HOME/.config/autostart"
LXDE_DIR="$HOME/.config/lxsession/LXDE-pi"
mkdir -p "$AUTOSTART_DIR" "$LXDE_DIR"

KIOSK_FLAGS="--kiosk --noerrdialogs --disable-infobars --disable-translate --check-for-update-interval=31536000 http://localhost:5173"
FULL_KIOSK_CMD="$CHROMIUM_BIN $KIOSK_FLAGS"

# Autostart XDG padrão
cat <<EOF > "$AUTOSTART_DIR/kiosk.desktop"
[Desktop Entry]
Type=Application
Name=SUSpicious Totem Kiosk
Exec=bash -c "unclutter -idle 0.1 -root & xset s off & xset -dpms & xset s noblank & $FULL_KIOSK_CMD"
X-GNOME-Autostart-enabled=true
EOF

# Autostart LXDE-pi tradicional
cat <<EOF > "$LXDE_DIR/autostart"
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
@$FULL_KIOSK_CMD
EOF

# Script de atalho rápido de teste no desktop
cat <<EOF > "$DESKTOP_DIR/Rodar_Totem.sh"
#!/bin/bash
$FULL_KIOSK_CMD &
EOF
chmod +x "$DESKTOP_DIR/Rodar_Totem.sh"

echo ""
echo "=========================================================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================================================="
echo "Navegador Detectado: [$CHROMIUM_BIN]"
echo "Pasta Área de Trabalho: [$DESKTOP_DIR]"
echo ""
echo "1. Para rodar manualmente agora na tela, digite:"
echo "   $CHROMIUM_BIN --kiosk http://localhost:5173"
echo "2. Para testar o boot automático:"
echo "   sudo reboot"
echo "=========================================================================="
