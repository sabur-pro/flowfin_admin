# FlowFin

Учёт личных финансов с голосовым вводом.

| Каталог | Что это | Технологии |
|---|---|---|
| [`flowfin/`](flowfin) | мобильное приложение | Expo, React Native, SQLite |
| [`back/`](back) | API, синхронизация, подписки, разбор голоса | NestJS, Prisma, PostgreSQL |
| [`admin/`](admin) | панель администратора | Next.js, TypeScript |

## Продакшен

Оба серверных сервиса поднимаются одним compose-файлом из каталога `back`:

```bash
cd back
docker compose -f docker-compose.prod.yml up -d --build
```

| Сервис | Домен | Порт внутри сети |
|---|---|---|
| API | `flowfin.intelligent.tj` | `api:3000` |
| Админка | `admin.flowfin.intelligent.tj` | `admin:3100` |
| База | не публикуется | `db:5432` |

Маршрутизацией и сертификатами занимается `nginx-proxy` с `acme-companion`,
живущий во внешней сети `proxy-network`. Контейнеры разъезжаются по заголовку
`Host`, поэтому у каждого свой поддомен и свой сертификат.

Пошаговый деплой — в [`DEPLOY.md`](DEPLOY.md).
