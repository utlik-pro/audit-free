# Быстрый деплой на VPS

## За 3 шага

### 1️⃣ Настройте сервер (один раз)

```bash
# На локальной машине
cd "/Users/admin/Utlik. Co/Audit_Free"
scp setup-server.sh root@104.253.1.54:/tmp/

# Подключитесь к серверу
ssh root@104.253.1.54
# Пароль: gxorqwTvKEKv7

# На сервере
bash /tmp/setup-server.sh
```

### 2️⃣ Задеплойте приложение

```bash
# На локальной машине
cd "/Users/admin/Utlik. Co/Audit_Free"
./deploy.sh
```

### 3️⃣ Откройте в браузере

```
http://104.253.1.54
```

---

## Обновление приложения

```bash
cd "/Users/admin/Utlik. Co/Audit_Free"
./deploy.sh
```

---

## Если что-то пошло не так

### SSH не подключается?

Используйте VNC через Proxmox:
- https://us301.vdska.ru:8006
- Логин: `mr.utlik@icloud.com_87730`
- Пароль: `oOnX8M5EmB7k`

### Приложение не открывается?

```bash
# На сервере
systemctl status nginx
tail -f /var/log/nginx/audit-free-error.log
```

### Нужна подробная инструкция?

См. файл `DEPLOYMENT.md`

---

## Важные команды

```bash
# Перезагрузка Nginx
systemctl reload nginx

# Проверка логов
tail -f /var/log/nginx/audit-free-error.log

# Проверка файлов на сервере
ssh root@104.253.1.54 "ls -la /var/www/audit-free"
```

---

**Сервер:** 104.253.1.54
**Логин:** root
**Пароль:** gxorqwTvKEKv7
