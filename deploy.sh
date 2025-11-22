#!/bin/bash

# Скрипт автоматического деплоя Audit Free на сервер
# Использование: ./deploy.sh

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфигурация сервера
SERVER_IP="104.253.1.54"
SERVER_USER="root"
SERVER_PATH="/var/www/audit-free"
DOMAIN="audit-free.utlik.pro"  # Замените на ваш домен или используйте IP

echo -e "${GREEN}=== Деплой Audit Free ===${NC}"
echo ""

# 1. Проверка наличия dist директории
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}Директория dist не найдена. Запускаю сборку...${NC}"
    npm run build
else
    echo -e "${YELLOW}Директория dist найдена. Хотите пересобрать проект? (y/n)${NC}"
    read -r rebuild
    if [ "$rebuild" = "y" ]; then
        npm run build
    fi
fi

echo ""
echo -e "${GREEN}1. Создание архива для загрузки...${NC}"
# Создаем архив dist директории
tar -czf dist.tar.gz -C dist .

echo -e "${GREEN}2. Загрузка файлов на сервер...${NC}"
# Копируем архив на сервер
scp dist.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo -e "${GREEN}3. Распаковка файлов на сервере...${NC}"
# Подключаемся к серверу и выполняем команды
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# Создаем директорию если не существует
mkdir -p /var/www/audit-free

# Распаковываем файлы
cd /var/www/audit-free
tar -xzf /tmp/dist.tar.gz

# Удаляем временный архив
rm /tmp/dist.tar.gz

# Устанавливаем правильные права
chown -R www-data:www-data /var/www/audit-free
chmod -R 755 /var/www/audit-free

echo "Файлы успешно загружены в /var/www/audit-free"
ENDSSH

# Удаляем локальный архив
rm dist.tar.gz

echo ""
echo -e "${GREEN}=== Деплой завершен! ===${NC}"
echo ""
echo -e "Приложение доступно по адресу: ${YELLOW}http://$SERVER_IP${NC}"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo "1. Настройте nginx (см. nginx.conf в директории проекта)"
echo "2. Настройте SSL сертификат (опционально)"
echo "3. Настройте домен для приложения"
echo ""
