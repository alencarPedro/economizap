#!/bin/bash

# EconomiZap Deployment Script

echo "EconomiZap Deployment Script"
echo "============================"
echo

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing..."
    npm install -g pm2
fi

# Build the project
echo "Building the project..."
npm install
npm run build

# Build the bot
echo "Building the bot..."
npm run build:bot

# Deploy options
echo
echo "Deployment Options:"
echo "1. Deploy web interface to Vercel"
echo "2. Run WhatsApp bot locally"
echo "3. Set up WhatsApp bot with PM2"
echo "4. Deploy both web interface and run bot"
echo "5. Exit"
echo

read -p "Select an option (1-5): " option

case $option in
    1)
        echo "Deploying web interface to Vercel..."
        vercel
        ;;
    2)
        echo "Running WhatsApp bot locally..."
        npm run start:bot
        ;;
    3)
        echo "Setting up WhatsApp bot with PM2..."
        pm2 start npm --name "economizap-bot" -- run start:bot
        echo "Do you want to configure PM2 to start on boot? (y/n)"
        read -p "> " configure_pm2
        if [ "$configure_pm2" = "y" ]; then
            pm2 startup
            pm2 save
        fi
        ;;
    4)
        echo "Deploying web interface to Vercel..."
        vercel --prod

        echo "Setting up WhatsApp bot with PM2..."
        pm2 start npm --name "economizap-bot" -- run start:bot
        echo "Do you want to configure PM2 to start on boot? (y/n)"
        read -p "> " configure_pm2
        if [ "$configure_pm2" = "y" ]; then
            pm2 startup
            pm2 save
        fi
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option. Exiting..."
        exit 1
        ;;
esac

echo
echo "Deployment completed!"
