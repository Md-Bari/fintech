FROM php:8.4-cli-alpine

WORKDIR /var/www

RUN apk add --no-cache bash git unzip libzip-dev postgresql-dev \
    && docker-php-ext-install pdo_pgsql bcmath pcntl zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --optimize-autoloader --no-interaction --no-progress --no-scripts

COPY . .

RUN chmod +x /var/www/docker/entrypoint.sh

EXPOSE 9000

ENTRYPOINT ["/var/www/docker/entrypoint.sh"]
