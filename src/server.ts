console.log('Starting WhatsApp bot server...');

const { Client, LocalAuth } = require('whatsapp-web.js');
// Import using require to ensure compatibility
const qrcode = require('qrcode-terminal');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { format, parse } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const { OpenAI } = require('openai');

// Load environment variables
console.log('Loading environment variables...');
dotenv.config();
console.log('Environment variables loaded.');

// Debug all environment variables
console.log('All environment variables:');
console.log(Object.keys(process.env).filter((key) => key.includes('SUPABASE')));

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
console.log('Supabase URL:', supabaseUrl);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
console.log('Supabase Key available:', supabaseKey ? 'Yes' : 'No');

if (!supabaseUrl) {
	console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is required');
	process.exit(1);
}

if (!supabaseKey) {
	console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is required');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize database tables
async function initializeDatabase() {
	try {
		console.log('Initializing database tables...');

		// First, try to create the tables
		try {
			// Read the SQL file content for tables
			const fs = require('fs');
			const path = require('path');
			const tablesFilePath = path.join(__dirname, '../sql/create_tables.sql');

			if (fs.existsSync(tablesFilePath)) {
				console.log('Creating database tables...');
				const tablesContent = fs.readFileSync(tablesFilePath, 'utf8');

				// Split the SQL content into individual statements
				const tableStatements = tablesContent.split(';').filter((stmt: string) => stmt.trim().length > 0);

				// Execute each statement
				for (const statement of tableStatements) {
					try {
						await supabase.rpc('exec_sql', { sql: statement + ';' });
					} catch (stmtError) {
						console.error('Error executing table SQL statement:', stmtError);
						// Continue with next statement
					}
				}

				console.log('Database tables created successfully');
			} else {
				console.log('Tables SQL file not found');
			}
		} catch (tablesError) {
			console.error('Error creating database tables:', tablesError);
		}

		// Then, try to execute the functions SQL script
		try {
			// Read the SQL file content for functions
			const fs = require('fs');
			const path = require('path');
			const functionsFilePath = path.join(__dirname, '../sql/create_functions.sql');

			if (fs.existsSync(functionsFilePath)) {
				console.log('Creating database functions...');
				const functionsContent = fs.readFileSync(functionsFilePath, 'utf8');

				// Split the SQL content into individual statements
				const functionStatements = functionsContent.split(';').filter((stmt: string) => stmt.trim().length > 0);

				// Execute each statement
				for (const statement of functionStatements) {
					try {
						await supabase.rpc('exec_sql', { sql: statement + ';' });
					} catch (stmtError) {
						console.error('Error executing function SQL statement:', stmtError);
						// Continue with next statement
					}
				}

				console.log('Database functions created successfully');
			} else {
				console.log('Functions SQL file not found, falling back to RPC calls');
				// Fall back to RPC call
				await createConversationHistoryTable();
			}
		} catch (functionsError) {
			console.error('Error creating database functions:', functionsError);
			// Fall back to RPC call
			await createConversationHistoryTable();
		}
	} catch (error) {
		console.error('Error initializing database:', error);
	}
}

// Helper function to create conversation history table via RPC
async function createConversationHistoryTable() {
	try {
		// Create conversation history table if it doesn't exist
		const { error } = await supabase.rpc('create_conversation_history_table');

		if (error) {
			console.error('Error creating conversation history table:', error);
			console.log('Attempting to create table directly...');

			// If RPC fails, try to create the table directly
			const { error: createError } = await supabase.from('conversation_history').select('count(*)').limit(1);

			if (createError && createError.code === '42P01') {
				// Table doesn't exist
				// Create the table directly
				const { error: tableError } = await supabase.rpc('exec_sql', {
					sql: `
					CREATE TABLE IF NOT EXISTS conversation_history (
						id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
						user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
						thread_id TEXT NOT NULL,
						message_content TEXT NOT NULL,
						role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
						created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
						metadata JSONB DEFAULT '{}'::jsonb
					);

					CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON conversation_history(user_id);
					CREATE INDEX IF NOT EXISTS idx_conversation_history_thread_id ON conversation_history(thread_id);
					`,
				});

				if (tableError) {
					console.error('Error creating table directly:', tableError);
				} else {
					console.log('Conversation history table created directly');
				}
			} else {
				console.log('Conversation history table already exists');
			}
		} else {
			console.log('Conversation history table initialized successfully');
		}
	} catch (error) {
		console.error('Error in createConversationHistoryTable:', error);
	}
}

// Call the initialization function
initializeDatabase().catch(console.error);

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation history for context
interface ConversationHistory {
	[userId: string]: Array<{ role: string; content: string }>;
}

const conversationHistory: ConversationHistory = {};
const MAX_HISTORY_LENGTH = 10; // Maximum number of messages to keep in history

// Simplify the formatWhatsAppId function
function formatWhatsAppId(whatsappId: string): string {
	// Extract just the numbers from the WhatsApp ID
	return whatsappId.replace('@c.us', '').replace(/[^0-9]/g, '');
}

// Add a function to check if a table uses UUID format for user_id
async function checkTableUserIdFormat(tableName: string): Promise<boolean> {
	try {
		// Query the database to check the column type
		const { data, error } = await supabase.rpc('get_column_type', {
			table_name: tableName,
			column_name: 'user_id',
		});

		if (error) {
			console.error(`Error checking column type for ${tableName}:`, error);
			// Default to string format if we can't determine
			return false;
		}

		// If the column type is uuid, return true
		return data === 'uuid';
	} catch (error) {
		console.error(`Error in checkTableUserIdFormat for ${tableName}:`, error);
		return false;
	}
}

// Simplify the getUserRecentExpenses function
async function getUserRecentExpenses(userId: string): Promise<string> {
	try {
		// Get the user data first to get the actual user ID
		const { data: userData, error: userError } = await supabase.from('users').select('id').eq('phone', userId).single();

		if (userError) {
			console.error('Error fetching user for expenses:', userError);
			return 'Não foi possível recuperar suas despesas recentes.';
		}

		if (!userData || !userData.id) {
			return 'Usuário não encontrado.';
		}

		const { data: expenses, error } = await supabase
			.from('expenses')
			.select('*')
			.eq('user_id', userData.id)
			.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
			.order('created_at', { ascending: false });

		if (error) throw error;

		if (!expenses || expenses.length === 0) {
			return 'Você não tem despesas registradas nos últimos 30 dias.';
		}

		let expensesText = 'Despesas recentes (últimos 30 dias):\n';
		expenses.forEach((expense: { amount: number; category: string; description: string; created_at: string }) => {
			const date = new Date(expense.created_at).toLocaleDateString('pt-BR');
			expensesText += `- ${date}: ${expense.description} (${expense.category}) - R$ ${expense.amount.toFixed(2)}\n`;
		});

		return expensesText;
	} catch (error) {
		console.error('Error fetching recent expenses:', error);
		return 'Não foi possível recuperar suas despesas recentes.';
	}
}

// Simplify the getUserSavingsGoals function
async function getUserSavingsGoals(userId: string): Promise<string> {
	try {
		// Get the user data first to get the actual user ID
		const { data: userData, error: userError } = await supabase.from('users').select('id').eq('phone', userId).single();

		if (userError) {
			console.error('Error fetching user for goals:', userError);
			return 'Não foi possível recuperar suas metas de economia.';
		}

		if (!userData || !userData.id) {
			return 'Usuário não encontrado.';
		}

		const { data: goals, error } = await supabase
			.from('savings_goals')
			.select('*')
			.eq('user_id', userData.id)
			.order('created_at', { ascending: false });

		if (error) throw error;

		if (!goals || goals.length === 0) {
			return 'Você não tem metas de economia definidas.';
		}

		let goalsText = 'Metas de economia:\n';
		goals.forEach((goal: { name: string; target_amount: number; current_amount: number; target_date: string }) => {
			const targetDate = new Date(goal.target_date);
			const formattedDate = targetDate.toLocaleDateString('pt-BR');
			const progress = (goal.current_amount / goal.target_amount) * 100;

			goalsText += `- ${goal.name}: R$ ${goal.current_amount.toFixed(2)} de R$ ${goal.target_amount.toFixed(2)}\n`;
			goalsText += `💰 Progresso: ${progress.toFixed(1)}%\n`;
			goalsText += `📅 Prazo: ${formattedDate}\n\n`;
		});

		return goalsText;
	} catch (error) {
		console.error('Error fetching savings goals:', error);
		return 'Não foi possível recuperar suas metas de economia.';
	}
}

// Update the detectAndProcessExpense function to use the user's actual ID
async function detectAndProcessExpense(userId: string, text: string, userData: any): Promise<string | null> {
	// Multiple regex patterns to detect different expense formats

	// Pattern 1: [description] [amount] [category]
	// Example: "Uber 12 transportation" or "Coffee 5.50 food"
	const pattern1 = /^([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(\d+[.,]?\d*)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;

	// Pattern 2: [amount] for [description] in [category]
	// Example: "12 for uber in transportation" or "5.50 for coffee in food"
	const pattern2 =
		/^(\d+[.,]?\d*)\s+(?:for|para|em|no|na)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(?:in|em|no|na|categoria)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;

	// Pattern 3: [description] for [amount] in [category]
	// Example: "uber for 12 in transportation" or "coffee for 5.50 in food"
	const pattern3 =
		/^([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(?:for|para|por|de|custa|custou)\s+(\d+[.,]?\d*)\s+(?:in|em|no|na|categoria)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;

	// Pattern 4: spent [amount] on [description] for [category]
	// Example: "spent 12 on uber for transportation" or "gastei 5.50 com coffee em food"
	const pattern4 =
		/^(?:spent|gastei|gasto|paguei|pago)\s+(\d+[.,]?\d*)\s+(?:on|em|no|na|com|para|por)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)\s+(?:for|em|no|na|categoria)\s+([a-zA-ZÀ-ÖØ-öø-ÿ\s]+)$/i;

	// Try each pattern
	let match = text.match(pattern1);
	let description = '';
	let amount = 0;
	let category = '';

	if (match) {
		description = match[1].trim();
		amount = parseFloat(match[2].replace(',', '.'));
		category = match[3].trim().toLowerCase();
	} else {
		match = text.match(pattern2);
		if (match) {
			amount = parseFloat(match[1].replace(',', '.'));
			description = match[2].trim();
			category = match[3].trim().toLowerCase();
		} else {
			match = text.match(pattern3);
			if (match) {
				description = match[1].trim();
				amount = parseFloat(match[2].replace(',', '.'));
				category = match[3].trim().toLowerCase();
			} else {
				match = text.match(pattern4);
				if (match) {
					amount = parseFloat(match[1].replace(',', '.'));
					description = match[2].trim();
					category = match[3].trim().toLowerCase();
				}
			}
		}
	}

	// If no pattern matched or amount is invalid, return null
	if (!match || isNaN(amount) || amount <= 0) {
		return null;
	}

	try {
		// Make sure we have the user data with the correct ID
		if (!userData || !userData.id) {
			const user = await getUserByPhone(userId);
			if (!user) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			userData = user;
		}

		// Add expense to database using the user's ID
		const { error } = await supabase.from('expenses').insert({
			user_id: userData.id,
			description,
			amount,
			category,
			created_at: new Date().toISOString(),
		});

		if (error) {
			console.error('Error inserting expense:', error);
			throw error;
		}

		// Update user balance
		const { error: updateError } = await supabase
			.from('users')
			.update({ balance: userData.balance - amount })
			.eq('id', userData.id);

		if (updateError) {
			console.error('Error updating balance:', updateError);
			throw updateError;
		}

		// Return confirmation message
		return `✅ Despesa registrada com sucesso!\n📝 Descrição: ${description}\n💰 Valor: R$ ${amount.toFixed(
			2
		)}\n🏷️ Categoria: ${category}`;
	} catch (error) {
		console.error('Error adding expense:', error);
		return 'Desculpe, ocorreu um erro ao registrar sua despesa. Tente novamente mais tarde.';
	}
}

// Analyze user's financial behavior and provide insights
async function analyzeUserFinancialBehavior(userId: string): Promise<string> {
	try {
		// Get the user data
		const userData = await getUserByPhone(userId);
		if (!userData || !userData.id) {
			return '';
		}

		// Get user's expenses for the last 30 days
		const { data: expenses, error: expensesError } = await supabase
			.from('expenses')
			.select('*')
			.eq('user_id', userData.id)
			.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

		if (expensesError) {
			console.error('Error fetching expenses for analysis:', expensesError);
			return '';
		}

		// Get user's savings goals
		const { data: goals, error: goalsError } = await supabase
			.from('savings_goals')
			.select('*')
			.eq('user_id', userData.id);

		if (goalsError) {
			console.error('Error fetching goals for analysis:', goalsError);
			return '';
		}

		// If no data, return empty string
		if (!expenses || expenses.length === 0) {
			return '';
		}

		// Define types for expense and goal
		interface Expense {
			amount: number;
			category: string;
			created_at: string;
		}

		interface Goal {
			target_amount: number;
			current_amount: number;
			target_date: string;
		}

		// Calculate total expenses
		const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

		// Group expenses by category
		const expensesByCategory: Record<string, number> = {};
		expenses.forEach((expense: Expense) => {
			const category = expense.category.toLowerCase();
			expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount;
		});

		// Find top spending categories
		const topCategories = Object.entries(expensesByCategory)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([category, amount]) => ({ category, amount }));

		// Calculate daily average spending
		const daysWithExpenses = new Set(expenses.map((e: Expense) => new Date(e.created_at).toDateString())).size;
		const dailyAverage = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0;

		// Check if user is on track with savings goals
		let savingsInsight = '';
		if (goals && goals.length > 0) {
			const activeGoals = goals.filter((goal: Goal) => new Date(goal.target_date) > new Date());

			if (activeGoals.length > 0) {
				const totalGoalAmount = activeGoals.reduce((sum: number, goal: Goal) => sum + goal.target_amount, 0);
				const totalCurrentAmount = activeGoals.reduce((sum: number, goal: Goal) => sum + goal.current_amount, 0);
				const overallProgress = (totalCurrentAmount / totalGoalAmount) * 100;

				if (overallProgress < 50) {
					savingsInsight = `\n\nVocê está com ${overallProgress.toFixed(
						1
					)}% de progresso em suas metas de economia. Considere aumentar seus depósitos mensais para atingir seus objetivos.`;
				} else {
					savingsInsight = `\n\nVocê está com bom progresso (${overallProgress.toFixed(
						1
					)}%) em suas metas de economia. Continue assim!`;
				}
			}
		}

		// Generate insights
		let insights = `Análise dos últimos 30 dias:\n`;
		insights += `- Total gasto: R$ ${totalExpenses.toFixed(2)}\n`;
		insights += `- Média diária: R$ ${dailyAverage.toFixed(2)}\n`;
		insights += `- Principais categorias de gastos:\n`;

		topCategories.forEach(({ category, amount }) => {
			const percentage = (amount / totalExpenses) * 100;
			insights += `  • ${category}: R$ ${amount.toFixed(2)} (${percentage.toFixed(1)}%)\n`;
		});

		insights += savingsInsight;

		return insights;
	} catch (error) {
		console.error('Error analyzing user financial behavior:', error);
		return '';
	}
}

// Update the getAIResponse function to include financial insights
async function getAIResponse(userId: string, userMessage: string, userData: any): Promise<string> {
	try {
		// Make sure we have the user data with the correct ID
		if (!userData || !userData.id) {
			const user = await getUserByPhone(userId);
			if (!user) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			userData = user;
		}

		// Get user's recent expenses
		const recentExpenses = await getUserRecentExpenses(userId);

		// Get user's savings goals
		const savingsGoals = await getUserSavingsGoals(userId);

		// Get financial behavior insights
		const financialInsights = await analyzeUserFinancialBehavior(userId);

		// Get or create a thread for this user
		const threadId = await getOrCreateThread(userId);

		// Save user message to Supabase
		try {
			try {
				// First try using the RPC function
				await supabase.rpc('save_conversation_message', {
					p_user_id: userData.id,
					p_thread_id: threadId,
					p_message_content: userMessage,
					p_role: 'user',
					p_metadata: { source: 'whatsapp' },
				});
				console.log(`Saved user message to conversation history for user ${userId}`);
			} catch (rpcError) {
				console.error('Error saving message via RPC, trying direct insert:', rpcError);

				// If RPC fails, try direct insert
				const { error: insertError } = await supabase.from('conversation_history').insert({
					user_id: userData.id,
					thread_id: threadId,
					message_content: userMessage,
					role: 'user',
					metadata: { source: 'whatsapp' },
				});

				if (insertError) {
					console.error('Error with direct insert:', insertError);
				} else {
					console.log(`Saved user message via direct insert for user ${userId}`);
				}
			}
		} catch (error) {
			console.error('Error saving user message to conversation history:', error);
			// Continue even if saving to DB fails
		}

		// Add the user's message to the thread
		await openai.beta.threads.messages.create(threadId, {
			role: 'user',
			content: userMessage,
		});

		// Use the specific assistant ID from environment variable or fallback to the hardcoded one
		const assistantId = process.env.ASSISTANT_ID || 'asst_mHPQNhkfsXrNsjBvMPd4Lj3F';
		console.log(`Using Assistant ID: ${assistantId}`);

		// Create a run with the assistant and financial context
		const run = await openai.beta.threads.runs.create(threadId, {
			assistant_id: assistantId,
			instructions: `You are EconomiZap, a helpful and friendly financial assistant.
				You help users manage their finances, track expenses, set savings goals, and provide financial advice.
				Be conversational, friendly, and helpful. Use emojis occasionally to make the conversation engaging.

				User's financial data:
				- Name: ${userData.name || 'Usuário'}
				- Current Balance: R$ ${userData?.balance ? userData.balance.toFixed(2) : '0.00'}

				${recentExpenses}

				${savingsGoals}

				${financialInsights ? `\nInsights financeiros:\n${financialInsights}` : ''}

				You can help the user with:
				1. Recording expenses (use !gasto command or simply type in natural language like "Uber 12 transportation")
				2. Creating savings goals (use !meta command)
				3. Viewing savings goals (use !metas command)
				4. Generating financial reports (use !relatorio command)
				5. Viewing expense charts (use !grafico command)

				The user can add expenses in natural language using these formats:
				- "Uber 12 transportation" (description amount category)
				- "12 for uber in transportation" (amount for description in category)
				- "uber for 12 in transportation" (description for amount in category)
				- "spent 12 on uber for transportation" (spent amount on description for category)

				If the user wants to perform a specific action like recording an expense or setting a goal,
				guide them to use the appropriate command or natural language format. For general financial advice, respond directly.

				Always respond in Portuguese (Brazilian) as this is a Brazilian financial assistant.`,
		});

		// Poll for the run to complete
		let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
		console.log(`Run created with status: ${runStatus.status}`);

		// Wait for the run to complete (simple polling)
		let attempts = 0;
		const maxAttempts = 30; // Maximum number of polling attempts (30 seconds)

		while ((runStatus.status === 'queued' || runStatus.status === 'in_progress') && attempts < maxAttempts) {
			// Wait for 1 second before checking again
			await new Promise((resolve) => setTimeout(resolve, 1000));
			runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
			attempts++;
			console.log(`Run status (attempt ${attempts}): ${runStatus.status}`);
		}

		// Check if run completed successfully
		if (runStatus.status !== 'completed') {
			console.error('Run did not complete successfully:', runStatus.status);
			if (runStatus.status === 'failed') {
				console.error('Run failed with error:', runStatus.last_error);
			} else if (attempts >= maxAttempts) {
				console.error('Run timed out after 30 seconds');
			}
			return 'Desculpe, estou com dificuldades para processar sua mensagem no momento. Você pode tentar novamente ou usar um dos comandos como !ajuda.';
		}

		// Get the latest messages from the thread
		const threadMessages = await openai.beta.threads.messages.list(threadId);

		// Find the most recent assistant message
		const assistantMessages = threadMessages.data.filter((msg: any) => msg.role === 'assistant');

		if (assistantMessages.length === 0) {
			return 'Não foi possível obter uma resposta. Por favor, tente novamente.';
		}

		// Get the content from the most recent assistant message
		const latestMessage = assistantMessages[0];

		// Extract text content from the message
		let responseText = '';
		if (latestMessage.content && latestMessage.content.length > 0) {
			for (const contentPart of latestMessage.content) {
				if (contentPart.type === 'text') {
					responseText += contentPart.text.value;
				}
			}
		}

		// Save assistant response to Supabase
		try {
			try {
				// First try using the RPC function
				await supabase.rpc('save_conversation_message', {
					p_user_id: userData.id,
					p_thread_id: threadId,
					p_message_content: responseText,
					p_role: 'assistant',
					p_metadata: {
						assistant_id: assistantId,
						run_id: run.id,
					},
				});
				console.log(`Saved assistant response to conversation history for user ${userId}`);
			} catch (rpcError) {
				console.error('Error saving assistant message via RPC, trying direct insert:', rpcError);

				// If RPC fails, try direct insert
				const { error: insertError } = await supabase.from('conversation_history').insert({
					user_id: userData.id,
					thread_id: threadId,
					message_content: responseText,
					role: 'assistant',
					metadata: {
						assistant_id: assistantId,
						run_id: run.id,
					},
				});

				if (insertError) {
					console.error('Error with direct insert:', insertError);
				} else {
					console.log(`Saved assistant message via direct insert for user ${userId}`);
				}
			}
		} catch (error) {
			console.error('Error saving assistant response to conversation history:', error);
			// Continue even if saving to DB fails
		}

		return responseText;
	} catch (error) {
		console.error('Error in getAIResponse:', error);
		return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente mais tarde.';
	}
}

// Store thread IDs for users
const userThreads: Record<string, string> = {};

// Get or create a thread for a user
async function getOrCreateThread(userId: string): Promise<string> {
	try {
		// Check if we already have a thread for this user
		if (userThreads[userId]) {
			console.log(`Using existing thread for user ${userId}: ${userThreads[userId]}`);

			// Verify that the thread still exists
			try {
				await openai.beta.threads.messages.list(userThreads[userId]);
				return userThreads[userId];
			} catch (error) {
				console.error(`Thread ${userThreads[userId]} no longer exists, creating a new one:`, error);
				// If there's an error, the thread might not exist anymore, so we'll create a new one
			}
		}

		// Create a new thread
		console.log(`Creating new thread for user ${userId}`);
		const thread = await openai.beta.threads.create();
		console.log(`Created new thread with ID: ${thread.id}`);

		// Store the thread ID
		userThreads[userId] = thread.id;

		// Try to get user data to retrieve conversation history
		try {
			const userData = await getUserByPhone(userId);

			if (userData && userData.id) {
				// Get recent conversation history from Supabase
				try {
					// First try using the RPC function
					const { data: conversationHistory, error } = await supabase.rpc('get_recent_conversation', {
						p_user_id: userData.id,
						p_limit: 10,
					});

					if (error) {
						console.error('Error retrieving conversation history via RPC:', error);
						// Try direct query
						const { data: directHistory, error: directError } = await supabase
							.from('conversation_history')
							.select('*')
							.eq('user_id', userData.id)
							.order('created_at', { ascending: false })
							.limit(10);

						if (directError) {
							console.error('Error retrieving conversation history via direct query:', directError);
						} else if (directHistory && directHistory.length > 0) {
							console.log(`Found ${directHistory.length} previous messages for user ${userId} via direct query`);

							// Add previous messages to the new thread to maintain context
							// Sort by created_at in ascending order to add oldest messages first
							const sortedHistory = [...directHistory].sort(
								(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
							);

							for (const message of sortedHistory) {
								try {
									await openai.beta.threads.messages.create(thread.id, {
										role: message.role as 'user' | 'assistant',
										content: message.message_content,
									});
									console.log(`Added ${message.role} message to new thread`);
								} catch (msgError) {
									console.error('Error adding message to thread:', msgError);
								}
							}
						}
					} else if (conversationHistory && conversationHistory.length > 0) {
						console.log(`Found ${conversationHistory.length} previous messages for user ${userId}`);

						// Add previous messages to the new thread to maintain context
						// Sort by created_at in ascending order to add oldest messages first
						const sortedHistory = [...conversationHistory].sort(
							(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
						);

						for (const message of sortedHistory) {
							try {
								await openai.beta.threads.messages.create(thread.id, {
									role: message.role as 'user' | 'assistant',
									content: message.message_content,
								});
								console.log(`Added ${message.role} message to new thread`);
							} catch (msgError) {
								console.error('Error adding message to thread:', msgError);
							}
						}
					}
				} catch (historyError) {
					console.error('Error processing conversation history:', historyError);
					// Continue even if we can't add history
				}
			}
		} catch (historyError) {
			console.error('Error processing conversation history:', historyError);
			// Continue even if we can't add history
		}

		return thread.id;
	} catch (error) {
		console.error('Error getting or creating thread:', error);

		// If we encounter an error, create a new thread as a fallback
		try {
			console.log(`Attempting to create fallback thread for user ${userId}`);
			const fallbackThread = await openai.beta.threads.create();
			userThreads[userId] = fallbackThread.id;
			return fallbackThread.id;
		} catch (fallbackError) {
			console.error('Failed to create fallback thread:', fallbackError);
			throw new Error('Failed to create thread for conversation');
		}
	}
}

// Add a utility function to get user by phone number
async function getUserByPhone(phone: string): Promise<any> {
	try {
		const formattedPhone = formatWhatsAppId(phone);
		const { data, error } = await supabase.from('users').select('*').eq('phone', formattedPhone).single();

		if (error && error.code !== 'PGRST116') {
			console.error('Error fetching user by phone:', error);
			return null;
		}

		// If user exists, return it
		if (data) {
			return data;
		}

		// If user doesn't exist, create a new one
		console.log(`User with phone ${formattedPhone} not found, creating new user...`);

		// Use a default name since we can't easily get the contact name here
		const name = 'New User';

		// Create new user
		const { data: newUser, error: createError } = await supabase
			.from('users')
			.insert({
				name: name,
				phone: formattedPhone,
				balance: 0,
			})
			.select('*')
			.single();

		if (createError) {
			console.error('Error creating user:', createError);
			return null;
		}

		console.log(`Created new user: ${newUser.name} (${newUser.phone})`);
		return newUser;
	} catch (error) {
		console.error('Error in getUserByPhone:', error);
		return null;
	}
}

// Helper function to generate ASCII bar chart
function generateASCIIBarChart(data: { label: string; value: number }[]): string {
	if (data.length === 0) return 'Não há dados para exibir';

	// Find the maximum value for scaling
	const maxValue = Math.max(...data.map((item) => item.value));

	// Sort data by value (descending)
	const sortedData = [...data].sort((a, b) => b.value - a.value);

	let chart = '📊 Gráfico de Despesas por Categoria:\n\n';

	sortedData.forEach((item: { label: string; value: number }) => {
		// Calculate bar length based on value relative to max
		const barLength = Math.round((item.value / maxValue) * 20);
		const bar = '█'.repeat(barLength);

		// Format the label and value
		chart += `${item.label.padEnd(15)} ${bar} R$ ${item.value.toFixed(2)}\n`;
	});

	return chart;
}

// Helper function to generate a simple text-based pie chart representation
function generateTextPieChart(data: { label: string; value: number }[]): string {
	if (data.length === 0) return 'Não há dados para exibir';

	// Calculate total
	const total = data.reduce((sum: number, item: { value: number }) => sum + item.value, 0);

	// Sort data by value (descending)
	const sortedData = [...data].sort((a, b) => b.value - a.value);

	// Pie chart symbols
	const symbols = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫'];

	let chart = '🥧 Distribuição de Despesas:\n\n';

	// Create legend with percentages
	sortedData.forEach((item: { label: string; value: number }, index: number) => {
		const percentage = (item.value / total) * 100;
		const pieceSize = Math.round(percentage / 5);
		const symbol = symbols[index % symbols.length];

		chart += `${symbol} ${item.label}: ${symbol.repeat(pieceSize)} ${percentage.toFixed(1)}%\n`;
	});

	return chart;
}

// Initialize WhatsApp client
const client = new Client({
	authStrategy: new LocalAuth(),
	puppeteer: {
		args: ['--no-sandbox'],
	},
});

// Store the client in a variable that can be accessed by other functions
let whatsappClient = client;

// Function to update user name from contact
async function updateUserNameFromContact(userId: string, contact: any): Promise<void> {
	try {
		if (!contact || !contact.name) return;

		const formattedPhone = formatWhatsAppId(userId);
		const { data: user } = await supabase.from('users').select('*').eq('phone', formattedPhone).single();

		// Only update if the user exists and has the default name
		if (user && user.name === 'New User') {
			const { error } = await supabase.from('users').update({ name: contact.name }).eq('phone', formattedPhone);

			if (error) {
				console.error('Error updating user name:', error);
			} else {
				console.log(`Updated user name for ${formattedPhone} to ${contact.name}`);
			}
		}
	} catch (error) {
		console.error('Error in updateUserNameFromContact:', error);
	}
}

// Map to store user states
const userStates: Record<
	string,
	{
		state: string;
		data: Record<string, any>;
	}
> = {};

// Command handlers
const commandHandlers: Record<string, (message: any, user: any, args?: string[]) => Promise<string>> = {
	async start(message: any, user: any) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		return (
			`👋 Olá ${user.name}! Bem-vindo ao EconomiZap!\n\n` +
			`Sou seu assistente financeiro pessoal. Como posso ajudar você hoje?\n\n` +
			`📱 *Comandos Disponíveis*\n\n` +
			`!gasto - Registrar uma nova despesa\n` +
			`!meta - Criar uma nova meta de economia\n` +
			`!metas - Ver suas metas de economia\n` +
			`!saldo - Verificar seu saldo atual\n` +
			`!relatorio - Gerar relatório financeiro\n` +
			`!grafico - Visualizar gráficos de despesas\n\n` +
			`Você também pode registrar despesas diretamente escrevendo no formato:\n` +
			`"Uber 12 transporte" (descrição valor categoria)\n\n` +
			`Ou simplesmente converse comigo sobre suas finanças! 💬`
		);
	},

	async gasto(message: any, user: any, args?: string[]) {
		return this.despesa(message, user, args);
	},

	async despesa(message: any, user: any, args?: string[]) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		// If args are provided, try to parse them directly
		if (args && args.length >= 3) {
			try {
				const description = args[0];
				const amount = parseFloat(args[1]);
				const category = args[2];

				if (isNaN(amount)) {
					return 'Valor inválido. Por favor, informe um número válido.';
				}

				// Add expense to database
				const { data: expense, error } = await supabase
					.from('expenses')
					.insert([
						{
							user_id: user.id,
							description,
							amount,
							category,
							date: new Date().toISOString(),
						},
					])
					.select();

				if (error) {
					console.error('Error adding expense:', error);
					return 'Erro ao adicionar despesa. Por favor, tente novamente.';
				}

				return `✅ Despesa "${description}" de R$ ${amount.toFixed(
					2
				)} na categoria "${category}" adicionada com sucesso!`;
			} catch (error) {
				console.error('Error parsing expense arguments:', error);
				return 'Formato inválido. Use: !gasto descrição valor categoria';
			}
		}

		// Set the user state to ADDING_EXPENSE
		userStates[message.from] = {
			state: 'AWAITING_EXPENSE_DESCRIPTION',
			data: {},
		};

		return 'Qual a descrição da despesa?';
	},

	async meta(message: any, user: any, args?: string[]) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		userStates[message.from] = { state: 'AWAITING_GOAL_NAME', data: {} };
		return 'Qual o nome da sua meta de economia?';
	},

	async metas(message: any, user: any) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		try {
			const { data: goals, error } = await supabase
				.from('savings_goals')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) throw error;

			if (!goals || goals.length === 0) {
				return 'Você ainda não tem metas de economia definidas. Use !meta para criar uma.';
			}

			let response = '🎯 *Suas Metas de Economia*\n\n';

			goals.forEach((goal: { name: string; target_amount: number; current_amount: number; target_date: string }) => {
				const targetDate = new Date(goal.target_date);
				const formattedDate = format(targetDate, 'dd/MM/yyyy');
				const progress = (goal.current_amount / goal.target_amount) * 100;

				response += `*${goal.name}*\n`;
				response += `💰 Progresso: R$ ${goal.current_amount.toFixed(2)} / R$ ${goal.target_amount.toFixed(2)}\n`;
				response += `📊 Completado: ${progress.toFixed(1)}%\n`;
				response += `📅 Prazo: ${formattedDate}\n\n`;
			});

			return response;
		} catch (error) {
			console.error('Error fetching savings goals:', error);
			return 'Desculpe, ocorreu um erro ao buscar suas metas de economia. Tente novamente mais tarde.';
		}
	},

	async saldo(message: any, user: any) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		return `💰 *Seu Saldo Atual*\nR$ ${user.balance.toFixed(2).replace('.', ',')}`;
	},

	async relatorio(message: any, user: any) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		try {
			// Get current month's expenses
			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const { data: expenses, error: expensesError } = await supabase
				.from('expenses')
				.select('*')
				.eq('user_id', user.id)
				.gte('created_at', startOfMonth.toISOString())
				.order('created_at', { ascending: false });

			if (expensesError) throw expensesError;

			const total = expenses?.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0) || 0;
			const monthName = format(new Date(), 'MMMM', { locale: ptBR });

			let report = `📊 *Relatório Financeiro - ${monthName}*\n\n`;
			report += `💰 Total de despesas: R$ ${total.toFixed(2).replace('.', ',')}\n\n`;

			// Group expenses by category
			const categories: Record<string, number> = {};
			expenses?.forEach((expense: { category: string; amount: number }) => {
				if (!categories[expense.category]) {
					categories[expense.category] = 0;
				}
				categories[expense.category] += expense.amount;
			});

			// Convert to array for sorting and chart generation
			const categoryData = Object.entries(categories).map(([label, value]) => ({ label, value }));

			// Sort by value (highest first)
			categoryData.sort((a, b) => b.value - a.value);

			// Add category breakdown
			report += `📋 *Despesas por Categoria*\n`;
			categoryData.forEach(({ label, value }) => {
				const percentage = (value / total) * 100;
				report += `${label}: R$ ${value.toFixed(2).replace('.', ',')} (${percentage.toFixed(1)}%)\n`;
			});

			// Add ASCII chart
			report += `\n${generateASCIIBarChart(categoryData)}\n`;

			// Add text pie chart
			report += `\n${generateTextPieChart(categoryData)}\n`;

			// Add note about using !grafico command
			report += `\nPara visualizar apenas os gráficos, use o comando !grafico`;

			return report;
		} catch (error) {
			console.error('Error generating report:', error);
			return 'Desculpe, ocorreu um erro ao gerar seu relatório. Tente novamente mais tarde.';
		}
	},

	async grafico(message: any, user: any) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		try {
			// Get current month's expenses
			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const { data: expenses, error: expensesError } = await supabase
				.from('expenses')
				.select('*')
				.eq('user_id', user.id)
				.gte('created_at', startOfMonth.toISOString())
				.order('created_at', { ascending: false });

			if (expensesError) throw expensesError;

			if (!expenses || expenses.length === 0) {
				return 'Você não tem despesas registradas neste mês.';
			}

			// Group expenses by category
			const categories: Record<string, number> = {};
			expenses.forEach((expense: { category: string; amount: number }) => {
				if (!categories[expense.category]) {
					categories[expense.category] = 0;
				}
				categories[expense.category] += expense.amount;
			});

			// Convert to array for chart generation
			const categoryData = Object.entries(categories).map(([label, value]) => ({ label, value }));

			// Sort by value (highest first)
			categoryData.sort((a, b) => b.value - a.value);

			// Generate charts
			const barChart = generateASCIIBarChart(categoryData);
			const pieChart = generateTextPieChart(categoryData);

			// Combine charts
			const response = `📊 *Gráficos de Despesas*\n\n${barChart}\n\n${pieChart}`;

			return response;
		} catch (error) {
			console.error('Error generating chart:', error);
			return 'Desculpe, ocorreu um erro ao gerar seu gráfico. Tente novamente mais tarde.';
		}
	},

	async ajuda(message: any, user: any) {
		// Make sure we have the user data with the correct ID
		if (!user || !user.id) {
			const userData = await getUserByPhone(formatWhatsAppId(message.from));
			if (!userData) {
				return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
			}
			user = userData;
		}

		return (
			`📱 *Comandos do EconomiZap*\n\n` +
			`!gasto - Registrar uma nova despesa\n` +
			`!meta - Criar uma nova meta de economia\n` +
			`!metas - Ver suas metas de economia\n` +
			`!saldo - Verificar seu saldo atual\n` +
			`!relatorio - Gerar relatório financeiro\n` +
			`!grafico - Visualizar gráficos de despesas\n\n` +
			`Você também pode registrar despesas diretamente escrevendo no formato:\n` +
			`"Uber 12 transporte" (descrição valor categoria)\n\n` +
			`Ou simplesmente converse comigo sobre suas finanças! 💬`
		);
	},
};

// State handlers
const stateHandlers: Record<string, (message: any, user: any, state: any) => Promise<string>> = {
	async AWAITING_EXPENSE_DESCRIPTION(message, user, state) {
		state.data.description = message.body;
		state.state = 'AWAITING_EXPENSE_AMOUNT';
		return 'Qual o valor da despesa? (apenas números, ex: 10.50)';
	},

	async AWAITING_EXPENSE_AMOUNT(message, user, state) {
		const amount = parseFloat(message.body.replace(',', '.'));
		if (isNaN(amount)) {
			return 'Por favor, digite um valor válido (apenas números, ex: 10.50)';
		}

		state.data.amount = amount;
		state.state = 'AWAITING_EXPENSE_CATEGORY';
		return 'Qual a categoria da despesa? (ex: Alimentação, Transporte, Lazer)';
	},

	async AWAITING_EXPENSE_CATEGORY(message, user, state) {
		state.data.category = message.body;

		try {
			// Make sure we have the user data with the correct ID
			if (!user || !user.id) {
				const userData = await getUserByPhone(formatWhatsAppId(message.from));
				if (!userData) {
					delete userStates[message.from];
					return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
				}
				user = userData;
			}

			// Save expense to database
			const { error } = await supabase.from('expenses').insert({
				user_id: user.id,
				description: state.data.description,
				amount: state.data.amount,
				category: state.data.category,
				created_at: new Date().toISOString(),
			});

			if (error) {
				console.error('Error inserting expense:', error);
				throw error;
			}

			// Update user balance
			const { error: balanceError } = await supabase.rpc('update_user_balance', {
				user_id_param: user.id,
				amount_param: -state.data.amount,
			});

			if (balanceError) {
				console.error('Error updating balance:', balanceError);
				throw balanceError;
			}

			// Clear user state
			delete userStates[message.from];

			return `✅ Despesa registrada com sucesso!\n\nDescrição: ${state.data.description}\nValor: R$ ${state.data.amount
				.toFixed(2)
				.replace('.', ',')}\nCategoria: ${state.data.category}`;
		} catch (error) {
			console.error('Error saving expense:', error);
			delete userStates[message.from];
			return 'Desculpe, não consegui salvar sua despesa. Tente novamente mais tarde.';
		}
	},

	async AWAITING_GOAL_NAME(message, user, state) {
		state.data.name = message.body;
		state.state = 'AWAITING_GOAL_AMOUNT';
		return 'Qual o valor da meta? (apenas números, ex: 1000.00)';
	},

	async AWAITING_GOAL_AMOUNT(message, user, state) {
		const amount = parseFloat(message.body.replace(',', '.'));
		if (isNaN(amount)) {
			return 'Por favor, digite um valor válido (apenas números, ex: 1000.00)';
		}

		state.data.amount = amount;
		state.state = 'AWAITING_GOAL_DATE';
		return 'Qual a data limite para atingir essa meta? (formato: DD/MM/AAAA)';
	},

	async AWAITING_GOAL_DATE(message, user, state) {
		try {
			// Make sure we have the user data with the correct ID
			if (!user || !user.id) {
				const userData = await getUserByPhone(formatWhatsAppId(message.from));
				if (!userData) {
					delete userStates[message.from];
					return 'Não foi possível encontrar seu cadastro. Por favor, tente novamente mais tarde.';
				}
				user = userData;
			}

			// Parse date
			const dateStr = message.body;
			const date = parse(dateStr, 'dd/MM/yyyy', new Date());

			if (isNaN(date.getTime())) {
				return 'Data inválida. Por favor, digite a data no formato DD/MM/AAAA:';
			}

			// Save goal to database
			const { error } = await supabase.from('savings_goals').insert({
				user_id: user.id,
				name: state.data.name,
				target_amount: state.data.amount,
				current_amount: 0,
				target_date: date.toISOString(),
				created_at: new Date().toISOString(),
			});

			if (error) {
				console.error('Error inserting goal:', error);
				throw error;
			}

			// Clear user state
			delete userStates[message.from];

			return `✅ Meta de economia criada com sucesso!\n\nNome: ${state.data.name}\nValor: R$ ${state.data.amount
				.toFixed(2)
				.replace('.', ',')}\nData: ${format(date, 'dd/MM/yyyy')}`;
		} catch (error) {
			console.error('Error saving goal:', error);
			delete userStates[message.from];
			return 'Desculpe, não consegui salvar sua meta. Tente novamente mais tarde.';
		}
	},
};

// Message handler
client.on(
	'message',
	async (message: {
		body: string;
		from: string;
		getContact: () => Promise<any>;
		reply: (text: string) => Promise<any>;
	}) => {
		try {
			// Get user from database using the utility function
			const userId = formatWhatsAppId(message.from);
			const user = await getUserByPhone(userId);

			// If we got a user (either existing or newly created)
			if (user) {
				// Get contact info and update user name if needed
				try {
					const contact = await message.getContact();
					if (contact && contact.name) {
						await updateUserNameFromContact(message.from, contact);
					}
				} catch (contactError) {
					console.error('Error getting contact info:', contactError);
				}
			} else {
				// If getUserByPhone failed to create a user, try to create one directly
				try {
					const contact = await message.getContact();
					const name = contact?.pushname || contact?.name || 'Usuário';

					const { data: newUser, error: createError } = await supabase
						.from('users')
						.insert({
							phone: userId,
							name,
							balance: 0,
						})
						.select('*')
						.single();

					if (createError) {
						console.error('Error creating user:', createError);
						await message.reply('Desculpe, ocorreu um erro. Tente novamente mais tarde.');
						return;
					}

					console.log(`Created new user: ${newUser.name} (${newUser.phone})`);
				} catch (createUserError) {
					console.error('Error creating user directly:', createUserError);
					await message.reply('Desculpe, ocorreu um erro. Tente novamente mais tarde.');
					return;
				}
			}

			// Check if user has an active state
			const userState = userStates[message.from];
			if (userState) {
				const handler = stateHandlers[userState.state];
				if (handler) {
					const response = await handler(message, user, userState);
					await message.reply(response);
				} else {
					delete userStates[message.from];
				}
			} else if (message.body.startsWith('/') || message.body.startsWith('!')) {
				// Handle commands
				const commandText = message.body.substring(1);
				const [command, ...args] = commandText.split(' ');

				const handler = commandHandlers[command.toLowerCase()];
				if (handler) {
					const response = await handler(message, user, args);
					await message.reply(response);
				} else {
					await message.reply(`Comando não reconhecido. Digite !ajuda para ver os comandos disponíveis.`);
				}
			} else {
				// Check if this is a natural language expense entry
				const expenseResult = await detectAndProcessExpense(userId, message.body, user);

				if (expenseResult) {
					// It was an expense entry, send the confirmation
					await message.reply(expenseResult);
				} else {
					// Handle natural language with AI
					const aiResponse = await getAIResponse(userId, message.body, user);
					await message.reply(aiResponse);
				}
			}
		} catch (error) {
			console.error('Error handling message:', error);
			await message.reply('Desculpe, ocorreu um erro. Tente novamente mais tarde.');
		}
	}
);

// WhatsApp client events
client.on('qr', (qr: string) => {
	console.log('QR RECEIVED:');
	qrcode.generate(qr, { small: true });
	console.log('Scan the QR code above to log in to WhatsApp Web');
});

client.on('ready', () => {
	console.log('Client is ready!');
});

client.on('authenticated', () => {
	console.log('Client is authenticated!');
});

client.on('auth_failure', (msg: string) => {
	console.error('WhatsApp authentication failed:', msg);
});

// Initialize client
client.initialize();

// Handle process termination
process.on('SIGINT', async () => {
	console.log('Shutting down...');
	await client.destroy();
	process.exit(0);
});
