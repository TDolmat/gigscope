# 🎯 AI Scoper

**AI Scoper** to aplikacja do automatycznego zbierania i wysyłania ofert pracy z różnych platform freelancerskich.

---

## 📚 Dokumentacja

### 🚀 Production Deployment
Pełna dokumentacja deployment do produkcji znajduje się w:
**[DEPLOYMENT.md](./DEPLOYMENT.md)**

### ⚡ Quick Start (Produkcja)

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/TWOJ_USER/ai-scoper.git
cd ai-scoper

# 2. Utwórz i wypełnij .env
cp env.template .env
nano .env

# 3. Start Docker Compose
docker compose up -d --build

# 4. Migracje bazy danych
docker compose exec backend flask db upgrade
```

---

## 🏗️ Architektura

```
AI Scoper Application
├── Frontend (Next.js 16)
│   ├── TypeScript + React 19
│   ├── TailwindCSS
│   └── Admin Panel
│
├── Backend (Flask + Gunicorn)
│   ├── Python 3.11
│   ├── PostgreSQL 16
│   ├── JWT Authentication
│   └── Scrapers (Apify)
│
└── Infrastructure
    ├── Docker + Docker Compose
    ├── Caddy (Reverse Proxy + SSL)
    └── PostgreSQL (Persistent storage)
```

---

## 💻 Development Setup

### Backend (Flask)

```bash
cd backend

# Utwórz virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# lub: venv\Scripts\activate  # Windows

# Instaluj zależności
pip install -r requirements.txt

# Setup bazy danych (PostgreSQL lokalnie)
# Upewnij się że PostgreSQL jest uruchomiony
createdb gigscope_development

# Migracje
flask db upgrade

# Uruchom development server
flask run
```

### Frontend (Next.js)

```bash
cd frontend

# Instaluj zależności
npm install

# Uruchom development server
npm run dev
```

Aplikacja będzie dostępna na:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🔧 Konfiguracja

### Zmienne środowiskowe

#### Development
Backend używa konfiguracji z `backend/core/config.py` (development mode).

#### Production
Skopiuj szablon, wygeneruj klucze i wypełnij wartości:
```bash
cp env.template .env

# Wygeneruj bezpieczne klucze
python3 -c "import secrets; print(secrets.token_hex(32))"  # SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"  # JWT_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32)[:32])"  # ENCRYPTION_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(24))"  # POSTGRES_PASSWORD

nano .env  # Edytuj i wklej wygenerowane klucze
```

---

## 📁 Struktura Projektu

```
ai-scoper/
├── backend/              # Flask API
│   ├── api/             # Blueprints (endpoints)
│   ├── core/            # Config, models, blueprints
│   ├── services/        # Business logic
│   ├── scrapers/        # Web scrapers
│   ├── migrations/      # Alembic migrations
│   └── Dockerfile       # Docker image for backend
│
├── frontend/            # Next.js App
│   ├── app/            # Pages (App Router)
│   ├── components/     # React components
│   ├── lib/           # Utilities, API client
│   └── Dockerfile     # Docker image for frontend
│
├── docker-compose.yml   # Orkiestracja kontenerów
├── Caddyfile           # Reverse proxy config
├── env.template  # Environment template
└── DEPLOYMENT.md       # Production deployment guide
```

---

## 🔒 Bezpieczeństwo

- **JWT Authentication** z cookie-based tokens
- **Password Hashing** (bcrypt)
- **HTTPS only** w produkcji (Caddy + Let's Encrypt)
- **CORS** skonfigurowany dla bezpiecznej komunikacji
- **Database encryption** dla wrażliwych danych
- **Non-root containers** w Docker

---

## 📊 Features

### Dla użytkowników:
- ✅ Automatyczne zbieranie ofert z Upwork
- ✅ Personalizacja preferencji emailowych
- ✅ System keywords dla filtrowania ofert
- ✅ Unsubscribe i zarządzanie preferencjami

### Admin Panel:
- ✅ Dashboard z statystykami
- ✅ Zarządzanie użytkownikami
- ✅ Ręczne uruchamianie scrapingu
- ✅ Wysyłanie emaili
- ✅ Logi i monitoring
- ✅ Ustawienia aplikacji (Apify API key, max offers, etc.)

---

## 🧪 Testing

```bash
# Backend tests (TODO)
cd backend
pytest

# Frontend tests (TODO)
cd frontend
npm test
```

---

## 📝 Maintenance

### Backup bazy danych
```bash
docker compose exec postgres pg_dump -U gigscope gigscope_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore bazy danych
```bash
cat backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres psql -U gigscope gigscope_prod
```

### Update aplikacji
```bash
git pull origin main
docker compose up -d --build
docker compose exec backend flask db upgrade
```

### Logi
```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 🆘 Support

Problemy z deploymentem? Zobacz:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Pełna dokumentacja deployment
- Sekcja Troubleshooting w DEPLOYMENT.md

---

## 🚀 Roadmap

- [ ] Dodanie więcej scraperów (Fiverr, Useme, etc.)
- [ ] Scheduled jobs (Celery + Redis)
- [ ] Real-time notifications (WebSockets)
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app

---

**Made with ❤️ for freelancers**
