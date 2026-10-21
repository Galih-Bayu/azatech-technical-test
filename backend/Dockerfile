FROM php:8.3-cli-alpine

# Install system dependencies & PostgreSQL dev libraries
RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    linux-headers

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_pgsql bcmath zip

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# Expose port 8000
EXPOSE 8000

# Start command: run migrations and start server
CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000
