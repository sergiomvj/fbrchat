#!/bin/sh

set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

echo "Running seed..."
npx prisma db seed

echo "Starting application..."
npm start
