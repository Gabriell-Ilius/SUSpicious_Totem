#!/bin/bash
# SUSpicious Totem - Raspberry Pi Kiosk Setup
# Execute isso no Raspberry Pi logo após instalar o OS padrão.

echo "========================================="
echo " Instalador: SUSpicious Totem Kiosk      "
echo "========================================="

# 1. Instalar dependências
echo "[1/4] Instalando Chromium, Unclutter e dependências..."
sudo apt-get update
sudo apt-get install -y chromium-browser unclutter xdotool libusb-1.0-0-dev python3-pip npm

# 2. Configurar Autostart do Kiosk Mode
echo "[2/4] Configurando autostart do Chromium (Kiosk Mode)..."
AUTOSTART_FILE="$HOME/.config/lxsession/LXDE-pi/autostart"
mkdir -p $(dirname $AUTOSTART_FILE)

cat << 'EOF' > $AUTOSTART_FILE
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@xset s off
@xset -dpms
@xset s noblank
@unclutter -idle 0.1 -root
@chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 http://localhost:5173
EOF

# 3. Configurar tmpfs para logs (Protege o Cartão SD)
echo "[3/4] Configurando tmpfs para proteger o SD Card..."
if ! grep -q "tmpfs /var/log" /etc/fstab; then
    echo "tmpfs /var/log tmpfs defaults,noatime,nosuid,mode=0755,size=100m 0 0" | sudo tee -a /etc/fstab
fi

# 4. Configurar regras UDEV para a impressora USB
echo "[4/4] Liberando permissões USB para a impressora térmica..."
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="04b8", ATTRS{idProduct}=="0202", MODE="0666", GROUP="dialout"' | sudo tee /etc/udev/rules.d/99-escpos.rules
sudo udevadm control --reload-rules
sudo udevadm trigger

echo "========================================="
echo " Instalação concluída! Reinicie o Pi.    "
echo " Lembre-se de configurar o systemd depois"
echo "========================================="
