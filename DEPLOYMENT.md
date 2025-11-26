# 🚀 Deployment Guide - Gigscope.pl

Kompletny przewodnik po wdrożeniu aplikacji Gigscope na serwer VPS OVH.

---

## 📋 Spis treści

1. [Wymagania](#wymagania)
2. [Architektura](#architektura)
3. [Przygotowanie serwera](#przygotowanie-serwera)
4. [Konfiguracja zmiennych środowiskowych](#konfiguracja-zmiennych-środowiskowych)
5. [Deployment](#deployment)
6. [Migracje bazy danych](#migracje-bazy-danych)
7. [Weryfikacja](#weryfikacja)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Wymagania

### Serwer VPS (OVH)
- **RAM**: 8GB (minimum 4GB)
- **CPU**: 2-4 cores
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS (zalecane) lub Debian 12

### Domena
- ✅ Domena `gigscope.pl` podpięta do IP serwera VPS
- ✅ DNS skonfigurowany (rekordy A):
  ```
  gigscope.pl     → IP_TWOJEGO_VPS
  www.gigscope.pl → IP_TWOJEGO_VPS
  ```

---

## 🏗️ Architektura

```
Internet (HTTPS)
       ↓
   Caddy (Port 80/443)
   ├─ gigscope.pl/*     → Frontend (Next.js:3000)
   └─ gigscope.pl/api/* → Backend (Flask+Gunicorn:5000)
                              ↓
                          PostgreSQL:5432
```

### Kontenery Docker:
1. **Caddy** - Reverse proxy + automatyczne SSL (Let's Encrypt)
2. **Frontend** - Next.js production build
3. **Backend** - Flask + Gunicorn (4 workery, 5 min timeout)
4. **PostgreSQL** - Baza danych z persistent volume

---

## 🔧 Przygotowanie serwera

### 1. Połącz się z serwerem VPS

```bash
ssh root@IP_TWOJEGO_VPS
```

### 2. Aktualizacja systemu

```bash
apt update && apt upgrade -y
```

### 3. Instalacja Docker & Docker Compose

```bash
# Instalacja Docker
curl -fsSL https://get.docker.com | sh

# Dodanie użytkownika do grupy docker (opcjonalnie)
usermod -aG docker $USER

# Instalacja Docker Compose (jeśli nie ma)
apt install docker-compose-plugin -y

# Weryfikacja instalacji
docker --version
docker compose version
```

### 4. Instalacja Git (jeśli nie ma)

```bash
apt install git -y
```

### 5. Konfiguracja firewalla (opcjonalnie)

```bash
# UFW firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

---

## 🔐 Konfiguracja zmiennych środowiskowych

### 1. Sklonuj repozytorium

```bash
# Utwórz katalog dla aplikacji webowych (jeśli nie istnieje)
mkdir -p /var/www

# Sklonuj repo
cd /var/www
git clone https://github.com/TWOJ_USER/gigscope.git
cd gigscope
```

**Uwaga:** Używamy `/var/www/` jako standardowej lokalizacji dla aplikacji webowych.
Alternatywnie możesz użyć `/srv/gigscope` lub `/home/deploy/gigscope`.

### 2. Utwórz plik `.env.production`

```bash
cp env.production.template .env.production
nano .env.production
```

### 3. Wygeneruj bezpieczne klucze

Otwórz terminal i wygeneruj klucze:

```bash
# SECRET_KEY (64 znaki)
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"

# JWT_SECRET_KEY (64 znaki)
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"

# ENCRYPTION_KEY (dokładnie 32 znaki)
python3 -c "import secrets; print('ENCRYPTION_KEY=' + secrets.token_urlsafe(32)[:32])"

# POSTGRES_PASSWORD (silne hasło)
python3 -c "import secrets; print('POSTGRES_PASSWORD=' + secrets.token_urlsafe(24))"
```

Skopiuj wygenerowane wartości.

### 4. Wypełnij `.env.production`

Przykładowa zawartość (wypełnij własnymi wartościami):

```bash
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_URL=postgresql://gigscope:TWOJE_SILNE_HASLO_DB@postgres:5432/gigscope_prod
POSTGRES_USER=gigscope
POSTGRES_PASSWORD=TWOJE_SILNE_HASLO_DB
POSTGRES_DB=gigscope_prod

# ============================================================================
# FLASK CONFIGURATION
# ============================================================================
FLASK_ENV=production
SECRET_KEY=WYGENERUJ_64_ZNAKOWY_HEX
ENCRYPTION_KEY=WYGENERUJ_DOKLADNIE_32_ZNAKI

# ============================================================================
# JWT AUTHENTICATION
# ============================================================================
JWT_SECRET_KEY=WYGENERUJ_64_ZNAKOWY_HEX
JWT_ACCESS_TOKEN_EXPIRES=900
JWT_REFRESH_TOKEN_EXPIRES=604800

# ============================================================================
# APPLICATION URLS
# ============================================================================
BASE_URL=https://gigscope.pl
CORS_ORIGINS=https://gigscope.pl
CIRCLE_URL=https://circle.so/c/be-free-club

# ============================================================================
# SCRAPING CONFIGURATION
# ============================================================================
APIFY_API_KEY=TWOJ_KLUCZ_APIFY
DEFAULT_MAX_MAIL_OFFERS=10

# ============================================================================
# OPTIONAL: EMAIL (jeśli używasz Resend)
# ============================================================================
# RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# FROM_EMAIL=noreply@gigscope.pl
```

### 5. Zabezpiecz plik .env

```bash
chmod 600 .env.production
```

---

## 🚀 Deployment

### 1. Zbuduj i uruchom kontenery

```bash
cd /var/www/gigscope
docker compose up -d --build
```

To zajmie kilka minut. Docker:
- Zbuduje obrazy dla backend i frontend
- Pobierze obrazy Caddy i PostgreSQL
- Utworzy sieci i volumes
- Uruchomi wszystkie kontenery

### 2. Sprawdź status kontenerów

```bash
docker compose ps
```

Wszystkie kontenery powinny być w stanie `Up (healthy)`:
```
NAME                   STATUS
gigscope_postgres      Up (healthy)
gigscope_backend       Up (healthy)
gigscope_frontend      Up (healthy)
gigscope_caddy         Up (healthy)
```

### 3. Sprawdź logi

```bash
# Wszystkie logi
docker compose logs -f

# Logi konkretnego serwisu
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f caddy
docker compose logs -f postgres
```

**Co powinno się stać:**
- Caddy automatycznie pobierze certyfikat SSL od Let's Encrypt
- PostgreSQL utworzy bazę danych
- Backend połączy się z bazą
- Frontend uruchomi Next.js server

---

## 🗄️ Migracje bazy danych

### 1. Uruchom migracje Alembic

```bash
docker compose exec backend flask db upgrade
```

To utworzy wszystkie tabele w bazie danych.

### 2. (Opcjonalnie) Utwórz pierwszego użytkownika admin

Możesz to zrobić przez Flask shell:

```bash
docker compose exec backend flask shell
```

W shellu:

```python
from core.models import db, User
from werkzeug.security import generate_password_hash

# Utwórz admina
admin = User(
    email='admin@gigscope.pl',
    password=generate_password_hash('TWOJE_HASLO'),
    is_admin=True,
    email_verified=True
)

db.session.add(admin)
db.session.commit()
print(f"Admin created: {admin.email}")
exit()
```

---

## ✅ Weryfikacja

### 1. Sprawdź czy strona działa

Otwórz przeglądarkę i wejdź na:
- https://gigscope.pl - Frontend (powinna się załadować strona główna)
- https://gigscope.pl/api/health - API health check (powinien zwrócić JSON)

### 2. Sprawdź certyfikat SSL

```bash
# Sprawdź czy Caddy uzyskał certyfikat
docker compose exec caddy caddy list-certificates
```

Powinieneś zobaczyć certyfikat dla `gigscope.pl`.

### 3. Test logowania

Wejdź na https://gigscope.pl/login i zaloguj się kontem admin.

---

## 🔧 Maintenance

### Restart kontenerów

```bash
# Restart wszystkich serwisów
docker compose restart

# Restart konkretnego serwisu
docker compose restart backend
docker compose restart frontend
```

### Aktualizacja aplikacji (po zmianach w kodzie)

```bash
cd /var/www/gigscope

# Pobierz najnowszy kod
git pull origin main

# Przebuduj i uruchom ponownie
docker compose up -d --build

# Uruchom migracje (jeśli są nowe)
docker compose exec backend flask db upgrade
```

### Backup bazy danych

```bash
# Backup
docker compose exec postgres pg_dump -U gigscope gigscope_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
cat backup_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres psql -U gigscope gigscope_prod
```

### Wyświetlanie logów

```bash
# Ostatnie 100 linii
docker compose logs --tail=100

# Follow (na żywo)
docker compose logs -f backend

# Logi z ostatniej godziny
docker compose logs --since 1h
```

### Sprawdzenie użycia zasobów

```bash
# CPU, RAM, Network
docker stats

# Rozmiar volumes
docker system df -v
```

### Czyszczenie starych obrazów (oszczędność miejsca)

```bash
# Usuń nieużywane obrazy, kontenery, sieci
docker system prune -a

# UWAGA: To usunie wszystko co nie jest używane!
```

---

## 🆘 Troubleshooting

### Problem: Kontenery nie startują

**Sprawdź logi:**
```bash
docker compose logs
```

**Najczęstsze przyczyny:**
- Błędne zmienne środowiskowe w `.env.production`
- Port 80/443 już zajęty przez inny proces
- Brak miejsca na dysku

**Rozwiązanie:**
```bash
# Zatrzymaj wszystko
docker compose down

# Sprawdź porty
ss -tlnp | grep -E ':(80|443)'
# lub
netstat -tulpn | grep -E ':(80|443)'

# Sprawdź miejsce na dysku
df -h

# Uruchom ponownie z czystą konfiguracją
docker compose up -d --build
```

---

### Problem: Backend nie może połączyć się z bazą

**Sprawdź:**
```bash
# Czy postgres jest healthy?
docker compose ps postgres

# Logi postgres
docker compose logs postgres

# Sprawdź zmienne środowiskowe backend
docker compose exec backend env | grep DATABASE_URL
```

**Rozwiązanie:**
- Upewnij się że `DATABASE_URL` w `.env.production` używa `postgres:5432` (nazwa serwisu, nie localhost)
- Sprawdź czy hasło jest poprawne

---

### Problem: Caddy nie może uzyskać certyfikatu SSL

**Sprawdź logi Caddy:**
```bash
docker compose logs caddy
```

**Najczęstsze przyczyny:**
- DNS nie wskazuje poprawnie na IP serwera
- Port 80 jest zablokowany (Let's Encrypt potrzebuje portu 80 do weryfikacji)
- Firewall blokuje ruch

**Rozwiązanie:**
```bash
# Sprawdź DNS
dig gigscope.pl +short
# Powinno zwrócić IP twojego VPS

# Sprawdź czy port 80 jest otwarty
curl -I http://gigscope.pl

# Sprawdź firewall
ufw status
```

---

### Problem: Frontend pokazuje błędy API

**Sprawdź czy backend działa:**
```bash
docker compose exec backend curl http://localhost:5000/api/health
```

**Sprawdź logi backendu:**
```bash
docker compose logs backend | tail -100
```

**Najczęstsze przyczyny:**
- CORS nie jest poprawnie skonfigurowany
- JWT cookies nie działają (secure flag)
- Błędne zmienne środowiskowe

---

### Problem: Długie requesty (scraping) się zawieszają

**Sprawdź timeout Gunicorn:**
```bash
docker compose exec backend cat gunicorn.conf.py | grep timeout
```

Powinno być `timeout = 300` (5 minut).

**Jeśli nadal problem:**
- Zwiększ timeout w `gunicorn.conf.py`
- Rozważ przeniesienie scrapingu do background tasks (Celery)

---

### Problem: Brak miejsca na dysku

**Sprawdź użycie:**
```bash
df -h
docker system df
```

**Czyszczenie:**
```bash
# Usuń stare logi
docker compose exec backend find /app/logs -name "*.log" -mtime +7 -delete

# Usuń nieużywane obrazy Docker
docker image prune -a

# Usuń nieużywane volumes (OSTROŻNIE!)
docker volume prune
```

---

## 📊 Monitoring (opcjonalnie)

### Proste monitorowanie z cron

Możesz dodać do crontaba automatyczne sprawdzanie statusu:

```bash
crontab -e

# Sprawdzaj co 5 minut czy wszystko działa
*/5 * * * * cd /var/www/gigscope && docker compose ps | grep -q "Up (healthy)" || docker compose restart
```

---

## 📞 Support

W razie problemów:
1. Sprawdź logi: `docker compose logs`
2. Sprawdź status: `docker compose ps`
3. Zrestartuj: `docker compose restart`

---

## ✅ Checklist końcowy

- [ ] DNS wskazuje na IP serwera
- [ ] Docker i Docker Compose zainstalowane
- [ ] `.env.production` utworzony z bezpiecznymi kluczami
- [ ] `docker compose up -d --build` wykonane
- [ ] Migracje bazy danych uruchomione
- [ ] Certyfikat SSL pobrany przez Caddy
- [ ] Strona dostępna pod https://gigscope.pl
- [ ] API health check działa
- [ ] Możesz się zalogować jako admin
- [ ] Backup bazy danych skonfigurowany

---

## 🎉 Gotowe!

Twoja aplikacja Gigscope jest teraz live na https://gigscope.pl! 🚀

