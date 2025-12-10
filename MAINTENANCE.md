# 🔧 AI Scoper - Maintenance Cheatsheet

Szybka ściągawka do zarządzania aplikacją na VPS.

---

## 🔄 Aktualizacja kodu

```bash
# 1. Zaloguj się na serwer
ssh ubuntu@151.80.147.100

# 2. Aktywuj SSH agent (po restarcie serwera)
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github_scoper

# 3. Przejdź do projektu
cd /var/www/scoper

# 4. Pobierz najnowszy kod
git pull

# 5. Przebuduj i uruchom kontenery
docker compose up -d --build

# 6. (Jeśli są nowe migracje) Uruchom migracje
docker compose exec backend flask db upgrade
```

---

## 🗄️ Dostęp do bazy danych (PostgreSQL)

### Metoda 1: Konsola na serwerze (psql)

```bash
# Zaloguj się do konsoli PostgreSQL
# Użyj wartości POSTGRES_USER i POSTGRES_DB z Twojego pliku .env
docker compose exec postgres psql -U TWOJ_USER -d TWOJ_DB

# Przykład (jeśli w .env masz POSTGRES_USER=gigscope i POSTGRES_DB=gigscope_prod):
docker compose exec postgres psql -U gigscope -d gigscope_prod
```

**Sprawdź swoje dane w `.env`:**
```bash
cat .env | grep POSTGRES
```

**Przydatne komendy SQL (po zalogowaniu):**
```sql
\dt                    -- Lista tabel
\d nazwa_tabeli        -- Struktura tabeli
SELECT * FROM users;   -- Przykładowe zapytanie
\q                     -- Wyjście
```

### Metoda 2: TablePlus / DBeaver przez SSH Tunneling 🖥️

Możesz połączyć się z bazą produkcyjną przez graficzny klient (TablePlus, DBeaver, pgAdmin) używając SSH tunneling.

#### Opcja A: Wbudowany SSH w TablePlus (ZALECANE ✅)

1. **Utwórz nowe połączenie** → wybierz PostgreSQL

2. **Sekcja PostgreSQL (góra):**
   - Host: `127.0.0.1` lub `localhost`
   - Port: `5432` ⚠️ **(port NA SERWERZE, nie lokalny!)**
   - User: `gigscope` (z .env: `POSTGRES_USER`)
   - Password: *hasło z .env na serwerze: `POSTGRES_PASSWORD`*
   - Database: `gigscope_prod` (z .env: `POSTGRES_DB`)
   - SSL mode: `PREFERRED`

3. **Sekcja "Over SSH" (dół):**
   - ✅ Włącz "Over SSH"
   - Server: `151.80.147.100`
   - Port: `22`
   - User: `ubuntu`
   - **Password**: *hasło SSH do serwera* (lub użyj klucza SSH - zaznacz "Use SSH key")

4. **Test Connection** → **Connect**

**Jak pobrać hasło do bazy z serwera:**
```bash
ssh ubuntu@151.80.147.100
cat /var/www/scoper/.env | grep POSTGRES_PASSWORD
```

#### Opcja B: Ręczny SSH Tunnel + połączenie

```bash
# Terminal (zostaw otwarte): Utwórz tunel SSH (lokalny 5433 → zdalny 5432)
ssh -L 5433:127.0.0.1:5432 ubuntu@151.80.147.100
```

W TablePlus/DBeaver utwórz zwykłe połączenie PostgreSQL:
- Host: `localhost`
- Port: `5433`
- User: `gigscope`
- Password: (z .env)
- Database: `gigscope_prod`

> ⚠️ **Bezpieczeństwo:** Port 5432 jest dostępny TYLKO przez SSH tunnel (127.0.0.1), nie z internetu.

---

## 🐍 Konsola Flask (Python shell)

```bash
# Uruchom Flask shell
docker compose exec backend flask shell

# Przykładowe użycie:
from core.models import db, User
users = User.query.all()
print(users)
exit()
```

---

## 📋 Inne przydatne komendy

```bash
# Status kontenerów
docker compose ps

# Logi (wszystkie)
docker compose logs -f

# Logi konkretnego serwisu
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f caddy

# Restart wszystkich kontenerów
docker compose restart

# Restart konkretnego serwisu
docker compose restart backend

# Zatrzymaj wszystko
docker compose down

# Uruchom wszystko
docker compose up -d
```

---

## 💾 Backup bazy danych

```bash
# Utwórz backup
docker compose exec postgres pg_dump -U gigscope gigscope_prod > backup_$(date +%Y%m%d).sql

# Przywróć backup
cat backup_YYYYMMDD.sql | docker compose exec -T postgres psql -U gigscope gigscope_prod
```

---

## 👤 Tworzenie admina

```bash
# Tryb interaktywny (zapyta o email i hasło)
docker compose exec backend python create_admin.py

# Tryb bezpośredni
docker compose exec backend python create_admin.py admin@befreeclub.pro TwojeHaslo123

# Lista wszystkich adminów
docker compose exec backend python create_admin.py --list
```
