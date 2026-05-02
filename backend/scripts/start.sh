#!/bin/sh

set -e

echo "Checking environment..."
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL is present. Creating .env file..."
  echo "DATABASE_URL=\"$DATABASE_URL\"" > .env
else
  echo "ERROR: DATABASE_URL is not set in environment!"
  env | grep _URL || true
fi

echo "Generating Prisma Client..."
npm run db:generate

echo "Syncing database schema..."
npm run db:push -- --accept-data-loss

echo "Running seed..."
npm run db:seed

echo "Starting application..."
npm start
