#!/usr/bin/env sh
set -e

cd /var/www

if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ -z "${APP_KEY}" ]; then
  echo "APP_KEY is not set. Set APP_KEY in docker-compose.yml."
  exit 1
fi

echo "Waiting for PostgreSQL..."
until php -r "
try {
  new PDO(
    'pgsql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT') . ';dbname=' . getenv('DB_DATABASE'),
    getenv('DB_USERNAME'),
    getenv('DB_PASSWORD')
  );
  exit(0);
} catch (Throwable \$e) {
  exit(1);
}
"; do
  sleep 2
done

echo "Running migrations..."
php artisan migrate --force

echo "Starting Laravel API on 0.0.0.0:9000"
exec php artisan serve --host=0.0.0.0 --port=9000
