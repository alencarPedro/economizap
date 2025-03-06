import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		// Initialize Supabase client
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

		if (!supabaseUrl || !supabaseKey) {
			return res.status(500).json({
				status: 'error',
				message: 'Missing Supabase configuration',
			});
		}

		const supabase = createClient(supabaseUrl, supabaseKey);

		// Check database connection
		const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });

		if (error) {
			return res.status(500).json({
				status: 'error',
				message: 'Database connection error',
				error: error.message,
			});
		}

		// Check OpenAI configuration
		const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
		const hasAssistantId = !!process.env.ASSISTANT_ID;

		return res.status(200).json({
			status: 'ok',
			database: 'connected',
			userCount: count || 0,
			openai: {
				configured: hasOpenAIKey && hasAssistantId,
				assistantId: process.env.ASSISTANT_ID || 'not configured',
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Status check error:', error);
		return res.status(500).json({
			status: 'error',
			message: 'Internal server error',
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}
