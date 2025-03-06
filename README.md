# EconomiZap

EconomiZap is a WhatsApp financial assistant bot that helps users manage their finances, track expenses, set savings goals, and provide financial advice.

## Project Structure

The project consists of two main components:

1. **Web Interface**: A Next.js web application that provides a status dashboard and API endpoints.
2. **WhatsApp Bot**: A Node.js application that connects to WhatsApp using the WhatsApp Web.js library.

## Deployment

### Web Interface Deployment (Vercel)

The web interface can be deployed to Vercel using the following steps:

1. **Fork or Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/economizap.git
   cd economizap
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Deploy to Vercel**

   Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

   Deploy to Vercel:

   ```bash
   vercel
   ```

   Follow the prompts to link your project to Vercel.

4. **Set Environment Variables**

   Set the following environment variables in the Vercel dashboard:

   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `ASSISTANT_ID`: Your OpenAI Assistant ID
   - `WHATSAPP_VERIFY_TOKEN`: A secret token for webhook verification

### WhatsApp Bot Deployment

The WhatsApp bot requires a persistent connection to WhatsApp, so it needs to be deployed on a server that can maintain this connection. Here are some options:

#### Option 1: Deploy on a VPS (Digital Ocean, AWS EC2, etc.)

1. **Set Up a VPS**

   Set up a VPS with Node.js installed.

2. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/economizap.git
   cd economizap
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Create Environment Variables**

   Create a `.env` file with the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ASSISTANT_ID=your_assistant_id
   WHATSAPP_VERIFY_TOKEN=your_webhook_token
   ```

5. **Build the Bot**

   ```bash
   npm run build:bot
   ```

6. **Run the Bot**

   ```bash
   npm run start:bot
   ```

   You'll need to scan the QR code with your WhatsApp to authenticate.

7. **Set Up PM2 for Persistence**

   Install PM2:

   ```bash
   npm install -g pm2
   ```

   Start the bot with PM2:

   ```bash
   pm2 start npm --name "economizap-bot" -- run start:bot
   ```

   Configure PM2 to start on boot:

   ```bash
   pm2 startup
   pm2 save
   ```

#### Option 2: Use a Webhook-Based Approach

If you want to use a serverless approach, you can modify the bot to use webhooks instead of maintaining a persistent connection. This would involve:

1. Setting up a webhook endpoint on your Vercel deployment
2. Using the WhatsApp Business API or a third-party service like Twilio to receive and send messages
3. Processing messages through your webhook endpoint

## API Endpoints

The web interface provides the following API endpoints:

- **GET /api/status**: Check the status of the application
- **POST /api/webhook**: Webhook endpoint for external integrations

## Development

To run the project locally:

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Run the Web Interface**

   ```bash
   npm run dev
   ```

3. **Run the WhatsApp Bot**

   ```bash
   npm run start:bot:dev
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
