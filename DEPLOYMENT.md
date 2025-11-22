# Руководство по деплою Audit Free на VPS

## Содержание

1. [Требования](#требования)
2. [Быстрый старт](#быстрый-старт)
3. [Подробная инструкция](#подробная-инструкция)
4. [Настройка SSL](#настройка-ssl)
5. [Обновление приложения](#обновление-приложения)
6. [Устранение неполадок](#устранение-неполадок)
7. [Альтернативные варианты деплоя](#альтернативные-варианты-деплоя)

## Требования

### На сервере:
- Ubuntu 20.04+ или Debian 10+ (или любой Linux с systemd)
- Nginx
- Доступ по SSH
- Root или sudo права

**Данные вашего сервера:**
- IP: `104.253.1.54`
- Логин: `root`
- Пароль: `gxorqwTvKEKv7`
- VNC: https://us301.vdska.ru:8006

### На локальной машине:
- Node.js 18+ и npm
- SSH клиент
- Доступ к серверу по SSH

## Быстрый старт

### Шаг 1: Настройка сервера (один раз)

Подключитесь к серверу и запустите скрипт настройки:

```bash
# На локальной машине
cd "/Users/admin/Utlik. Co/Audit_Free"

# Копируем скрипт на сервер
scp setup-server.sh root@104.253.1.54:/tmp/

# Подключаемся к серверу
ssh root@104.253.1.54
# Пароль: gxorqwTvKEKv7

# На сервере - запускаем настройку
cd /tmp
bash setup-server.sh
```

Скрипт автоматически:
- Установит Nginx
- Создаст директорию `/var/www/audit-free`
- Настроит конфигурацию Nginx
- Настроит файрвол
- Установит Certbot для SSL

### Шаг 2: Деплой приложения

На локальной машине:

```bash
cd "/Users/admin/Utlik. Co/Audit_Free"
./deploy.sh
```

Скрипт автоматически:
- Соберет production build (если нужно)
- Создаст архив
- Загрузит на сервер
- Распакует в `/var/www/audit-free`
- Установит правильные права доступа

### Шаг 3: Проверка

Откройте в браузере:
- `http://104.253.1.54` - должно открыться приложение

## Подробная инструкция

### 1. Первоначальная настройка сервера

#### 1.1. Подключение к серверу

```bash
ssh root@104.253.1.54
```

Пароль: `gxorqwTvKEKv7`

#### 1.2. Проверка существующих проектов

**ВАЖНО:** Перед началом проверьте, какие проекты уже развернуты:

```bash
# Проверяем /var/www
ls -la /var/www/

# Проверяем активные сайты в Nginx
ls -la /etc/nginx/sites-enabled/

# Проверяем запущенные процессы
ps aux | grep -E 'nginx|node|apache' | grep -v grep
```

Это поможет избежать конфликтов с существующими проектами.

#### 1.3. Обновление системы

```bash
apt-get update
apt-get upgrade -y
```

#### 1.4. Установка Nginx (если не установлен)

```bash
# Проверяем наличие Nginx
which nginx

# Если не установлен:
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
```

#### 1.5. Создание директории для приложения

```bash
mkdir -p /var/www/audit-free
chown -R www-data:www-data /var/www/audit-free
chmod -R 755 /var/www/audit-free
```

#### 1.6. Настройка Nginx

Скопируйте конфигурацию из проекта:

```bash
# На локальной машине
scp nginx.conf root@104.253.1.54:/etc/nginx/sites-available/audit-free

# На сервере
ln -s /etc/nginx/sites-available/audit-free /etc/nginx/sites-enabled/
nginx -t  # Проверка конфигурации
systemctl reload nginx  # Мягкая перезагрузка (не затронет другие сайты)
```

### 2. Сборка и деплой приложения

#### 2.1. Локальная сборка

```bash
cd "/Users/admin/Utlik. Co/Audit_Free"
npm run build
```

Проверьте, что директория `dist` создана и содержит файлы.

#### 2.2. Автоматический деплой

```bash
./deploy.sh
```

#### 2.3. Ручная загрузка (если deploy.sh не работает)

```bash
# Создаем архив
tar -czf dist.tar.gz -C dist .

# Копируем на сервер
scp dist.tar.gz root@104.253.1.54:/tmp/

# На сервере
ssh root@104.253.1.54
cd /var/www/audit-free
tar -xzf /tmp/dist.tar.gz
rm /tmp/dist.tar.gz
chown -R www-data:www-data /var/www/audit-free
chmod -R 755 /var/www/audit-free
```

### 3. Проверка работы

```bash
# Проверка файлов
ls -la /var/www/audit-free

# Проверка Nginx
systemctl status nginx
nginx -t

# Проверка логов
tail -f /var/log/nginx/audit-free-access.log
tail -f /var/log/nginx/audit-free-error.log

# Тест локально на сервере
curl http://localhost
```

## Настройка SSL

После успешного деплоя настройте SSL для безопасного соединения.

### Требования:
- Домен должен быть направлен на IP сервера (104.253.1.54)
- Порты 80 и 443 должны быть открыты

### Получение сертификата

```bash
# На сервере
sudo certbot --nginx -d audit-free.utlik.pro
```

Certbot автоматически:
- Получит SSL сертификат
- Обновит конфигурацию Nginx
- Настроит автоматическое обновление

### Автообновление сертификата

Certbot автоматически настраивает cron для обновления. Проверка:

```bash
# Проверка таймера обновления
systemctl status certbot.timer

# Тестовое обновление
certbot renew --dry-run
```

## Обновление приложения

При внесении изменений в код:

```bash
# На локальной машине
cd "/Users/admin/Utlik. Co/Audit_Free"

# Вносим изменения в код...

# Деплоим обновление
./deploy.sh
```

Скрипт спросит, нужно ли пересобрать проект перед загрузкой.

### Быстрое обновление без пересборки

Если build уже готов:

```bash
./deploy.sh
# При вопросе о пересборке ответьте: n
```

## Устранение неполадок

### Приложение не открывается

1. **Проверьте статус Nginx:**
```bash
systemctl status nginx
```

2. **Проверьте конфигурацию:**
```bash
nginx -t
```

3. **Проверьте файлы:**
```bash
ls -la /var/www/audit-free
# Должен быть index.html и папки assets
```

4. **Проверьте логи:**
```bash
tail -f /var/log/nginx/audit-free-error.log
```

5. **Проверьте конфликты портов:**
```bash
netstat -tlnp | grep :80
# Убедитесь, что порт 80 слушает только nginx
```

### Ошибка 404 при переходе по ссылкам

Это означает, что React Router не работает. Проверьте конфигурацию Nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Эта строка должна быть в конфигурации.

### Конфликт с другими проектами

Если на сервере уже есть другие проекты:

```bash
# Проверьте все активные сайты
ls -la /etc/nginx/sites-enabled/

# Проверьте конфликты портов и доменов
nginx -T | grep server_name
nginx -T | grep listen
```

Убедитесь, что:
- Каждый сайт использует уникальный `server_name` или порт
- Нет дублирующихся `server_name` для одного порта

### Проблемы с правами доступа

```bash
# На сервере
chown -R www-data:www-data /var/www/audit-free
chmod -R 755 /var/www/audit-free
```

### SSH подключение не работает

1. **Проверьте доступность сервера:**
```bash
ping 104.253.1.54
```

2. **Используйте альтернативный метод - VNC через Proxmox:**
   - Адрес: https://us301.vdska.ru:8006
   - Логин: mr.utlik@icloud.com_87730
   - Пароль: oOnX8M5EmB7k
   - Тип авторизации: Proxmox VE authentication server

## Мониторинг

### Просмотр логов в реальном времени

```bash
# Access лог
tail -f /var/log/nginx/audit-free-access.log

# Error лог
tail -f /var/log/nginx/audit-free-error.log

# Оба лога
tail -f /var/log/nginx/audit-free-*.log
```

### Статистика использования

```bash
# Количество запросов
wc -l /var/log/nginx/audit-free-access.log

# Топ IP адресов
awk '{print $1}' /var/log/nginx/audit-free-access.log | sort | uniq -c | sort -rn | head -10
```

## Структура проекта на сервере

```
/var/www/audit-free/
├── index.html              # Главная страница
├── assets/                 # Статические файлы
│   ├── index-*.css        # Стили
│   └── index-*.js         # JavaScript bundle
└── [другие статические файлы]

/etc/nginx/
├── sites-available/
│   └── audit-free         # Конфигурация Nginx
└── sites-enabled/
    └── audit-free -> ../sites-available/audit-free

/var/log/nginx/
├── audit-free-access.log  # Логи доступа
└── audit-free-error.log   # Логи ошибок
```

## Полезные команды

```bash
# Перезапуск Nginx (затронет все сайты!)
systemctl restart nginx

# Перезагрузка конфигурации без остановки (безопаснее)
systemctl reload nginx

# Проверка конфигурации
nginx -t

# Просмотр статуса
systemctl status nginx

# Просмотр всех виртуальных хостов
nginx -T | grep server_name

# Очистка логов (если они слишком большие)
truncate -s 0 /var/log/nginx/audit-free-*.log
```

## Бэкап и восстановление

### Создание бэкапа

```bash
# На сервере
tar -czf /tmp/audit-free-backup-$(date +%Y%m%d).tar.gz -C /var/www audit-free

# Скачать на локальную машину
scp root@104.253.1.54:/tmp/audit-free-backup-*.tar.gz ./backups/
```

### Восстановление из бэкапа

```bash
# Загрузить бэкап на сервер
scp backup.tar.gz root@104.253.1.54:/tmp/

# На сервере
cd /var/www
tar -xzf /tmp/backup.tar.gz
chown -R www-data:www-data audit-free
chmod -R 755 audit-free
systemctl reload nginx
```

## Переменные окружения

Приложение использует следующие переменные (встроены в build):
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_TELEGRAM_BOT_TOKEN`
- `VITE_TELEGRAM_ADMIN_CHAT_ID`

Эти переменные берутся из `.env` файла при сборке и **не могут быть изменены** после деплоя без пересборки.

---

## Альтернативные варианты деплоя

### Вариант 1: Netlify (Рекомендуется - бесплатно и просто)

#### Шаг 1: Создайте аккаунт на Netlify
1. Перейдите на [netlify.com](https://www.netlify.com/)
2. Зарегистрируйтесь через GitHub

#### Шаг 2: Деплой через Drag & Drop
1. Откройте [app.netlify.com/drop](https://app.netlify.com/drop)
2. Перетащите папку `dist` в область загрузки
3. Дождитесь завершения деплоя
4. Получите URL вашего сайта

#### Шаг 3: Настройка переменных окружения
1. Перейдите в Site Settings → Environment Variables
2. Добавьте переменные:
   - `VITE_SUPABASE_URL` = ваш URL из Supabase
   - `VITE_SUPABASE_ANON_KEY` = ваш anon key из Supabase

#### Шаг 4: Настройка редиректов для SPA
Создайте файл `public/_redirects`:
```
/*    /index.html   200
```

### Вариант 2: Vercel (Также бесплатно)

#### Шаг 1: Установите Vercel CLI
```bash
npm i -g vercel
```

#### Шаг 2: Деплой
```bash
vercel --prod
```

Следуйте инструкциям в терминале.

### Вариант 3: GitHub Pages (Бесплатно для публичных репозиториев)

#### Шаг 1: Обновите vite.config.ts
```typescript
export default defineConfig({
  base: '/dept-pulse-survey/', // имя вашего репозитория
  // ...
})
```

#### Шаг 2: Добавьте workflow файл
Создайте `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### Шаг 3: Настройте секреты
1. Перейдите в Settings → Secrets в вашем репозитории
2. Добавьте:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Вариант 4: Хостинг (VPS/Shared Hosting)

#### Для Apache
Создайте файл `.htaccess` в папке dist:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

#### Для Nginx
Добавьте в конфигурацию:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

#### Загрузка файлов
1. Загрузите содержимое папки `dist` на сервер
2. Убедитесь, что все файлы доступны

## Переменные окружения

Создайте файл `.env.production` перед сборкой:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Команды для сборки

```bash
# Установка зависимостей
npm install

# Сборка для продакшена
npm run build

# Локальный просмотр собранной версии
npm run preview
```

## Проверка после деплоя

1. ✅ Главная страница загружается
2. ✅ Навигация между страницами работает
3. ✅ Опрос можно пройти
4. ✅ Данные сохраняются в Supabase
5. ✅ Админка работает (проверьте пароль: 125690)
6. ✅ Архивирование и удаление работают

## Оптимизация

### Уменьшение размера бандла
В файле `vite.config.ts` добавьте:
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

## Безопасность

⚠️ **Важно для продакшена:**

1. Измените пароль админки в файле `src/pages/Admin.tsx`
2. Настройте CORS в Supabase Dashboard
3. Включите RLS с правильными политиками
4. Используйте HTTPS на продакшене
5. Регулярно обновляйте зависимости

## Поддержка

При проблемах проверьте:
- Консоль браузера (F12)
- Логи сервера
- Настройки Supabase
- Переменные окружения