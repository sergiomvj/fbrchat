#!/bin/sh

set -e

echo "Generating Prisma Client..."
npm run db:generate

echo "Syncing database schema..."
npm run db:push -- --accept-data-loss

echo "Running seed..."
npm run db:seed

echo "Starting application..."
npm start
