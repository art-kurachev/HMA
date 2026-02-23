# Деплой

## Требования

- Сервер с Linux (Ubuntu 22.04+)
- Python 3.10+
- Node.js 18+
- nginx
- SSL-сертификат (Let's Encrypt)
- Домен (или поддомен)

## Вариант 1: VPS (nginx + systemd)

### 1. Backend

```bash
# Клонировать
cd /opt
git clone git@github.com:art-kurachev/HMA.git hookah
cd hookah/backend

# Виртуальное окружение
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Конфиг
cp .env.example .env
nano .env
# Установить: DATABASE_URL, LLM_PROVIDER, DISABLE_DAILY_LIMIT=false
```

Systemd unit `/etc/systemd/system/hookah-api.service`:

```ini
[Unit]
Description=Hookah Assistant API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hookah/backend
ExecStart=/opt/hookah/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
EnvironmentFile=/opt/hookah/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable hookah-api
sudo systemctl start hookah-api
sudo systemctl status hookah-api
```

### 2. Frontend

```bash
cd /opt/hookah/frontend
npm install
VITE_API_BASE=https://api.your-domain.com npm run build
# dist/ готова для nginx
```

### 3. nginx

```nginx
# Frontend
server {
    listen 443 ssl;
    server_name app.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/app.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.your-domain.com/privkey.pem;

    root /opt/hookah/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 443 ssl;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo certbot --nginx -d app.your-domain.com -d api.your-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Telegram Mini App

1. Открыть @BotFather → `/newapp`
2. Указать URL: `https://app.your-domain.com`

## Вариант 2: Vercel + Railway

### Frontend → Vercel

1. Подключить репо на vercel.com
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output: `dist`
5. Env: `VITE_API_BASE=https://your-api.railway.app`

### Backend → Railway

1. Подключить репо на railway.app
2. Root directory: `backend`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Добавить PostgreSQL addon
5. Env: `DATABASE_URL`, `LLM_PROVIDER`, etc.

## Обновление (deploy)

```bash
cd /opt/hookah
git pull origin main

# Backend
cd backend
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart hookah-api

# Frontend
cd ../frontend
npm install
VITE_API_BASE=https://api.your-domain.com npm run build
```

## Rollback

```bash
cd /opt/hookah
git log --oneline -5          # найти нужный коммит
git checkout <commit-hash>    # откатить
sudo systemctl restart hookah-api
# пересобрать frontend если нужно
```

## Проверка после деплоя

```bash
curl https://api.your-domain.com/health
# {"status":"ok"}

curl https://app.your-domain.com
# HTML Mini App
```
