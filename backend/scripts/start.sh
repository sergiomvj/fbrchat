#!/bin/sh

set -e

echo "Checking environment..."
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set in environment!"
  env | grep _URL || true
else
  echo "DATABASE_URL is present."
fi

echo "Generating Prisma Client..."
npm run db:generate

echo "Syncing database schema..."
npm run db:push -- --accept-data-loss

echo "Running seed..."
npm run db:seed

echo "Starting application..."
npm start
