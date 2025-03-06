#!/bin/bash

# EconomiZap Environment Setup Script

echo "EconomiZap Environment Setup Script"
echo "=================================="
echo

# Check if .env file exists
if [ -f .env ]; then
    echo ".env file already exists. Do you want to overwrite it? (y/n)"
    read -p "> " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Exiting without changes."
        exit 0
    fi
fi

# Get environment variables
echo "Please enter the following environment variables:"
echo

read -p "Supabase URL (NEXT_PUBLIC_SUPABASE_URL): " supabase_url
read -p "Supabase Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY): " supabase_anon_key
read -p "Supabase Service Role Key (SUPABASE_SERVICE_ROLE_KEY): " supabase_service_role_key
read -p "OpenAI API Key (OPENAI_API_KEY): " openai_api_key
read -p "OpenAI Assistant ID (ASSISTANT_ID): " assistant_id
read -p "WhatsApp Verify Token (WHATSAPP_VERIFY_TOKEN): " whatsapp_verify_token

# Create .env file
echo "Creating .env file..."
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=${supabase_url}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabase_anon_key}
SUPABASE_SERVICE_ROLE_KEY=${supabase_service_role_key}
OPENAI_API_KEY=${openai_api_key}
ASSISTANT_ID=${assistant_id}
WHATSAPP_VERIFY_TOKEN=${whatsapp_verify_token}
EOF

echo
echo "Environment variables set up successfully!"
echo "You can now run the deployment script with ./deploy.sh"
