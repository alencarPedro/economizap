#!/bin/bash

echo "Building WhatsApp bot..."
npm run build:bot

echo "Starting WhatsApp bot with .env variables..."
node -r dotenv/config dist/server.js
