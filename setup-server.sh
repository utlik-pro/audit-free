#!/bin/bash

# Скрипт настройки сервера для Audit Free
# ВАЖНО: Этот скрипт должен быть запущен на СЕРВЕРЕ под root
# Использование: bash setup-server.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Настройка сервера для Audit Free ===${NC}"
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ошибка: Скрипт должен быть запущен от root${NC}"
    echo "Используйте: sudo bash setup-server.sh"
    exit 1
fi

# 1. Обновление системы
echo -e "${BLUE}1. Обновление системы...${NC}"
apt-get update
apt-get upgrade -y

# 2. Установка Nginx
echo -e "${BLUE}2. Установка Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx установлен${NC}"
else
    echo -e "${YELLOW}Nginx уже установлен${NC}"
fi

# 3. Установка certbot для SSL (опционально)
echo -e "${BLUE}3. Установка Certbot для SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo -e "${GREEN}Certbot установлен${NC}"
else
    echo -e "${YELLOW}Certbot уже установлен${NC}"
fi

# 4. Создание директории для приложения
echo -e "${BLUE}4. Создание директории для приложения...${NC}"
mkdir -p /var/www/audit-free
chown -R www-data:www-data /var/www/audit-free
chmod -R 755 /var/www/audit-free
echo -e "${GREEN}Директория создана: /var/www/audit-free${NC}"

# 5. Настройка Nginx
echo -e "${BLUE}5. Настройка Nginx...${NC}"

# Проверяем, существует ли уже конфигурация
if [ -f /etc/nginx/sites-available/audit-free ]; then
    echo -e "${YELLOW}Конфигурация уже существует. Создаю резервную копию...${NC}"
    cp /etc/nginx/sites-available/audit-free /etc/nginx/sites-available/audit-free.backup.$(date +%Y%m%d_%H%M%S)
fi

# Создаем конфигурацию nginx
cat > /etc/nginx/sites-available/audit-free << 'EOF'
server {
    listen 80;
    listen [::]:80;

    server_name audit-free.utlik.pro 104.253.1.54;

    root /var/www/audit-free;
    index index.html;

    access_log /var/log/nginx/audit-free-access.log;
    error_log /var/log/nginx/audit-free-error.log;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    server_tokens off;
}
EOF

# Создаем симлинк если его нет
if [ ! -L /etc/nginx/sites-enabled/audit-free ]; then
    ln -s /etc/nginx/sites-available/audit-free /etc/nginx/sites-enabled/
    echo -e "${GREEN}Конфигурация активирована${NC}"
else
    echo -e "${YELLOW}Конфигурация уже активирована${NC}"
fi

# 6. Проверка конфигурации Nginx
echo -e "${BLUE}6. Проверка конфигурации Nginx...${NC}"
nginx -t

# 7. Перезапуск Nginx
echo -e "${BLUE}7. Перезапуск Nginx...${NC}"
systemctl restart nginx
systemctl status nginx --no-pager | head -n 10

# 8. Настройка файрвола (если используется ufw)
echo -e "${BLUE}8. Настройка файрвола...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw status | grep -i nginx || echo -e "${YELLOW}UFW не активен${NC}"
else
    echo -e "${YELLOW}UFW не установлен, пропускаю...${NC}"
fi

echo ""
echo -e "${GREEN}=== Настройка сервера завершена! ===${NC}"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Загрузите файлы приложения в /var/www/audit-free"
echo "   Используйте: ./deploy.sh (на локальной машине)"
echo ""
echo "2. Опционально: Настройте SSL сертификат"
echo "   sudo certbot --nginx -d audit-free.utlik.pro"
echo ""
echo "3. Проверьте работу приложения:"
echo "   curl http://104.253.1.54"
echo ""
echo -e "${BLUE}Полезные команды:${NC}"
echo "- Перезапуск Nginx: systemctl restart nginx"
echo "- Просмотр логов: tail -f /var/log/nginx/audit-free-error.log"
echo "- Проверка статуса: systemctl status nginx"
echo ""
