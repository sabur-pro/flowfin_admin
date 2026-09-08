# Деплой

API и админка живут на одном сервере в одном compose-проекте и разъезжаются по
поддоменам. Ниже — порядок с нуля до работающей панели.

| Что | Домен | Контейнер |
|---|---|---|
| API | `flowfin.intelligent.tj` | `flowfin_api` |
| Админка | `admin.flowfin.intelligent.tj` | `flowfin_admin` |
| База | не публикуется наружу | `flowfin_db` |

---

## ⚠️ Одно правило, которое нельзя нарушать

**Запускайте compose только из каталога `back`.**

```bash
cd back && docker compose -f docker-compose.prod.yml up -d
```

Docker берёт имя проекта из имени каталога, а к имени проекта привязан том с
базой — `back_postgres_data`. Запуск из другого каталога или с флагом `-p`
создаст **новый пустой том**, и продакшен-база останется висеть в старом.
Данные не пропадут, но приложение их не увидит.

Админка добавлена в тот же файл именно поэтому: чтобы имя проекта не поменялось.

---

## Шаг 1. Git (локально)

Репозитория ещё нет. Перед первым коммитом убедитесь, что секреты не уедут:

```bash
cd ~/projects/my-finance
git init
git add -A
git status --short | grep -E '\.env$'      # должно быть пусто
```

Если строка нашлась — remove из индекса и проверьте `.gitignore`:

```bash
git rm --cached back/.env admin/.env 2>/dev/null
```

Коммит и пуш:

```bash
git commit -m "Админка на Next.js: юнит-экономика, пользователи, финансы"
git branch -M main
git remote add origin git@github.com:<ваш-аккаунт>/flowfin.git
git push -u origin main
```

На сервере нужен **весь репозиторий**, а не только `back/`: compose собирает
админку из `../admin`.

---

## Шаг 2. DNS — до первого запуска

Добавьте A-запись у регистратора `intelligent.tj`:

```
admin.flowfin.intelligent.tj.   A   <IP вашего сервера>
```

Проверьте, что запись разошлась:

```bash
dig +short admin.flowfin.intelligent.tj
```

**Порядок важен.** Let's Encrypt проверяет домен HTTP-запросом. Если поднять
контейнер до того, как DNS заработает, выпуск сертификата провалится, и Let's
Encrypt на несколько часов включит лимит на повторные попытки для этого домена.

---

## Шаг 3. Проверьте, что nginx-proxy на месте

```bash
docker ps --filter "network=proxy-network" --format "table {{.Names}}\t{{.Image}}"
```

Должны быть два контейнера: сам `nginx-proxy` и `acme-companion` (или
`letsencrypt-nginx-proxy-companion`). Если сети нет:

```bash
docker network create proxy-network
```

Порты 80 и 443 должны быть открыты — иначе сертификат не выпустится.

---

## Шаг 4. Выкатка

```bash
ssh <ваш-сервер>
cd ~/flowfin            # каталог, куда клонировали репозиторий
git pull

cd back
cat .env | grep -c .    # убедитесь, что .env на месте, он не в гите

docker compose -f docker-compose.prod.yml up -d --build
```

Первая сборка админки занимает 2–4 минуты: ставятся зависимости и собирается
Next. Дальше слои кэшируются, и пересборка идёт быстрее.

Проверка:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f admin
```

В логах должно появиться `Ready in ...` и порт 3100.

---

## Шаг 5. Сертификат

Выпуск занимает 30–90 секунд после старта контейнера:

```bash
docker logs <имя-контейнера-acme> --tail 40
curl -I https://admin.flowfin.intelligent.tj/login
```

Ожидаемый ответ — `HTTP/2 200`. Если `502` — админка ещё поднимается,
подождите полминуты. Если `503` — nginx-proxy не увидел контейнер: проверьте,
что он в сети `proxy-network`.

---

## Шаг 6. Аккаунт администратора

Роль `ADMIN` по сети не выдаётся — только скриптом на сервере.

**Заведите отдельный аккаунт для панели.** API держит одну активную сессию на
пользователя: вход в админку разлогинит этот же аккаунт в мобильном приложении.

```bash
# 1. Регистрация
curl -X POST https://flowfin.intelligent.tj/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowfin.tj","password":"<надёжный-пароль>","name":"Admin"}'

# 2. Повышение до администратора
cd back
docker compose -f docker-compose.prod.yml exec api npm run make-admin -- admin@flowfin.tj
```

Ожидаемый вывод: `✅ admin@flowfin.tj теперь администратор`.

Откройте `https://admin.flowfin.intelligent.tj` и войдите.

---

## Обновление

```bash
cd ~/flowfin && git pull
cd back && docker compose -f docker-compose.prod.yml up -d --build
```

Пересобирать можно только изменившееся:

```bash
docker compose -f docker-compose.prod.yml up -d --build admin
```

Миграции Prisma накатываются автоматически при старте `api` — это уже зашито
в его команду запуска.

---

## Если что-то не так

| Симптом | Причина | Что делать |
|---|---|---|
| `503` на поддомене | контейнер не в `proxy-network` | `docker inspect flowfin_admin -f '{{json .NetworkSettings.Networks}}'` |
| `502` дольше минуты | админка падает при старте | `docker compose logs admin` |
| Сертификат не выпустился | DNS не разошёлся или закрыт порт 80 | `dig +short admin.flowfin.intelligent.tj`, логи acme |
| «API недоступен» на входе | админка не видит `api:3000` | `docker compose exec admin wget -qO- http://api:3000/api/admin/overview` |
| «Нет доступа в админку» | роль осталась `USER` | повторите `make-admin` |
| Вход есть, разделы пустые | база пустая, это нормально | проверьте `docker compose exec db psql -U flowfin -c 'select count(*) from users'` |
| Форма входа ничего не делает | Server Action отклонён по Origin | проверьте `ADMIN_ALLOWED_ORIGINS` в compose, пересоберите админку |
| База «сбросилась» | compose запущен не из `back/` | `docker volume ls \| grep postgres` — ищите `back_postgres_data` |

---

## Что важно знать про эту конфигурацию

**Админка не выставляет API наружу заново.** Она ходит в него по внутренней
сети Docker на `http://api:3000`: трафик не выходит в интернет и не проходит
через TLS повторно. Наружу торчит только сама панель.

**Токен лежит в `httpOnly`-куке** и в браузерный JavaScript не попадает. Все
запросы к API уходят с сервера Next, поэтому токен физически недоступен для XSS.

**Проверка прав двойная.** `proxy.ts` отсекает анонимов на краю ради лишнего
редиректа, но настоящая защита — в `requireAdminContext` и в самом API, где
`/api/admin/*` закрыт связкой `AuthGuard('jwt')` + `RolesGuard` + `@Roles(ADMIN)`.
Даже если панель полностью обойти, без токена администратора API не отдаст ничего.

**Открытый CORS.** В `back/src/main.ts` стоит `origin: '*'` с пометкой «restrict
in production». Для мобильного приложения это не проблема — оно не браузер и
куки не шлёт. Но перед публичным запуском список стоит сузить.
