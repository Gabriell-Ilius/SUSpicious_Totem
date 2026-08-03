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
sudo apt install -y python3-pip python3-venv nodejs npm chromium-browser unclutter libusb-1.0-0-dev git

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
sudo udevadm control --reload-rules && sudo udevadm trigger

# 5. Criar Serviço Systemd para iniciar o Backend automaticamente no Boot
echo "⚙️  5/6: Criando serviço de boot automático (suspicious-backend.service)..."
WORKING_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
USER_NAME="$(whoami)"

sudo bash -c "cat <<EOF > /etc/systemd/system/suspicious-backend.service
[Unit]
Description=Backend FastAPI - SUSpicious Totem
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$WORKING_DIR
ExecStart=$WORKING_DIR/venv/bin/python main.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOF"

sudo systemctl daemon-reload
sudo systemctl enable suspicious-backend.service
sudo systemctl restart suspicious-backend.service

# 6. Configurar Modo Kiosk no Chromium (Autostart da Tela Touch 7")
echo "🖥️  6/6: Configurando inicialização em Tela Cheia Touch (Kiosk Mode)..."
AUTOSTART_DIR="$HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

cat <<EOF > "$AUTOSTART_DIR/kiosk.desktop"
[Desktop Entry]
Type=Application
Name=SUSpicious Totem Kiosk
Exec=bash -c "unclutter -idle 0.1 -root & xset s off & xset -dpms & xset s noblank & chromium-browser --kiosk --noerrdialogs --disable-infobars --disable-translate --check-for-update-interval=31536000 http://localhost:5173"
X-GNOME-Autostart-enabled=true
EOF

echo ""
echo "=========================================================================="
echo "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=========================================================================="
echo "1. Para rodar o frontend local em desenvolvimento: cd frontend && npm run dev"
echo "2. Reinicie o Raspberry Pi para testar o boot em Kiosk Mode:"
echo "   sudo reboot"
echo "=========================================================================="
