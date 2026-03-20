# Генератор тестовых записей

Этот модуль нужен для заполнения базы случайными пользователями на основе заранее заданных константных значений.

## Что делает

Генератор:

- создает пользователей из случайных имен, городов, возрастов и описаний
- формирует предпочтения пользователя
- выбирает случайный набор интересов
- при необходимости добавляет вредные привычки
- сохраняет данные в таблицы базы батчами и параллельно несколькими worker'ами

## Какие таблицы заполняет

Ожидается, что генератор пишет в:

- `users`
- `user_preferences`
- `user_interests`
- `user_bad_habits`
- `user_preferred_bad_habits`

## Где находится

Точка входа находится здесь:

```text
generator/main.go
```

## Как запускать

Через переменную окружения `POSTGRES_DSN`:

```bash
cd generator && POSTGRES_DSN="postgres://postgres:postgres@localhost:5432/couplefinder?sslmode=disable" go run . -count 300
```

Или явно через флаг `-dsn`:

```bash
cd generator && go run . -count 300 -dsn "postgres://postgres:postgres@localhost:5432/couplefinder?sslmode=disable"
```

## Основные параметры

### `-count`
Количество создаваемых пользователей.

Пример:

```bash
cd generator && go run . -count 100
```

### `-dsn`
Строка подключения к PostgreSQL.

Пример:

```bash
cd generator && go run . -count 100 -dsn "postgres://postgres:postgres@localhost:5432/couplefinder?sslmode=disable"
```

### `-workers`
Количество параллельных worker'ов.

Пример:

```bash
cd generator && go run . -count 10000 -workers 8
```

### `-batch-size`
Сколько пользователей писать в одной транзакции.

Пример:

```bash
cd generator && go run . -count 10000 -workers 8 -batch-size 500
```

## Что важно перед запуском

Перед запуском генератора:

- база должна быть поднята
- миграции должны быть уже применены
- таблицы должны существовать

## Когда использовать

Генератор нужен для:

- первичного наполнения базы
- тестирования алгоритмов
- проверки интерфейса поиска
- просмотра данных через db-viewer
