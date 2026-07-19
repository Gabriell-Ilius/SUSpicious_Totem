#!/bin/bash
# SUSpicious Totem - Auto Reboot Script
# 
# Instalação:
# 1. Execute 'crontab -e' no Raspberry Pi
# 2. Adicione a linha abaixo para reiniciar às 3:00 AM diariamente:
# 0 3 * * * /home/pi/SUSpicious/scripts/reboot_cron.sh

echo "[$(date)] Iniciando processo de reinício de manutenção noturna do SUSpicious Totem..." >> /var/log/suspicious-reboot.log

# O systemd cuidará de desligar os serviços graciosamente
sudo reboot
