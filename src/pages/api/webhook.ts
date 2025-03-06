import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	// Only allow POST requests
	if (req.method !== 'POST') {
		return res.status(405).json({ status: 'error', message: 'Method not allowed' });
	}

	try {
		// Verify webhook token if provided
		const token = req.headers['x-webhook-token'];
		const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

		if (verifyToken && token !== verifyToken) {
			return res.status(401).json({ status: 'error', message: 'Unauthorized' });
		}

		// Initialize Supabase client
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

		if (!supabaseUrl || !supabaseKey) {
			return res.status(500).json({ status: 'error', message: 'Missing Supabase configuration' });
		}

		const supabase = createClient(supabaseUrl, supabaseKey);

		// Initialize OpenAI client
		const openaiApiKey = process.env.OPENAI_API_KEY;
		const assistantId = process.env.ASSISTANT_ID;

		if (!openaiApiKey || !assistantId) {
			return res.status(500).json({ status: 'error', message: 'Missing OpenAI configuration' });
		}

		const openai = new OpenAI({ apiKey: openaiApiKey });

		// Get request body
		const { action, userId, message, threadId } = req.body;

		if (!action) {
			return res.status(400).json({ status: 'error', message: 'Missing action parameter' });
		}

		// Handle different actions
		switch (action) {
			case 'send_message': {
				// Validate required parameters
				if (!userId || !message) {
					return res.status(400).json({ status: 'error', message: 'Missing required parameters' });
				}

				// Get or create thread
				let thread;
				if (threadId) {
					// Use existing thread
					thread = { id: threadId };
				} else {
					// Create new thread
					thread = await openai.beta.threads.create();
				}

				// Add message to thread
				await openai.beta.threads.messages.create(thread.id, {
					role: 'user',
					content: message,
				});

				// Run the assistant
				const run = await openai.beta.threads.runs.create(thread.id, {
					assistant_id: assistantId,
				});

				return res.status(200).json({
					status: 'ok',
					message: 'Message sent to assistant',
					threadId: thread.id,
					runId: run.id,
				});
			}

			case 'get_response': {
				// Validate required parameters
				if (!threadId) {
					return res.status(400).json({ status: 'error', message: 'Missing threadId parameter' });
				}

				// Get messages from thread
				const messages = await openai.beta.threads.messages.list(threadId);

				// Find the most recent assistant message
				const assistantMessages = messages.data.filter((msg) => msg.role === 'assistant');

				if (assistantMessages.length === 0) {
					return res.status(404).json({ status: 'error', message: 'No assistant messages found' });
				}

				// Get the content from the most recent assistant message
				const latestMessage = assistantMessages[0];
				let responseText = '';

				if (latestMessage.content && latestMessage.content.length > 0) {
					for (const contentPart of latestMessage.content) {
						if (contentPart.type === 'text') {
							responseText += contentPart.text.value;
						}
					}
				}

				return res.status(200).json({
					status: 'ok',
					message: responseText,
					threadId: threadId,
				});
			}

			default:
				return res.status(400).json({ status: 'error', message: 'Invalid action' });
		}
	} catch (error) {
		console.error('Webhook error:', error);
		return res.status(500).json({
			status: 'error',
			message: 'Internal server error',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}
