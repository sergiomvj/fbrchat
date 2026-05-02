#!/bin/sh

set -e

echo "Adjusting permissions..."
chmod +x ./node_modules/.bin/prisma

echo "Syncing database schema..."
npx prisma db push --accept-data-loss

echo "Running seed..."
npx prisma db seed

echo "Starting application..."
npm start
