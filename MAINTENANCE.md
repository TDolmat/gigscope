# 🔧 Gigscope - Maintenance Cheatsheet

Szybka ściągawka do zarządzania aplikacją na VPS.

---

## 🔄 Aktualizacja kodu

```bash
# 1. Zaloguj się na serwer
ssh ubuntu@151.80.147.100

# 2. Aktywuj SSH agent (po restarcie serwera)
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github_gigscope

# 3. Przejdź do projektu
cd /var/www/gigscope

# 4. Pobierz najnowszy kod
git pull

# 5. Przebuduj i uruchom kontenery
docker compose up -d --build

# 6. (Jeśli są nowe migracje) Uruchom migracje
docker compose exec backend flask db upgrade
```

---

## 🗄️ Dostęp do bazy danych (PostgreSQL)

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
docker compose exec backend python create_admin.py admin@gigscope.pl TwojeHaslo123

# Lista wszystkich adminów
docker compose exec backend python create_admin.py --list
```

