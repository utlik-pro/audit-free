# Инструкция по деплою приложения

## Варианты деплоя

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