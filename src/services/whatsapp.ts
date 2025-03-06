import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import {
	analyzeUserMessage,
	generateExpenseResponse,
	generateBillReminderResponse,
	generateSavingsGoalResponse,
} from './openai';
import * as db from '../lib/supabase';
import { Category, Expense } from '../types/database';
import { formatExpenseChart, formatExpenseCategoryChart, formatSavingsGoalChart } from '../utils/chartGenerator';
import { startOfWeek, endOfWeek, subWeeks, isAfter } from 'date-fns';

let client: Client;

export async function initWhatsApp() {
	try {
		console.log('Initializing WhatsApp client...');

		client = new Client({
			authStrategy: new LocalAuth(),
			puppeteer: {
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			},
		});

		client.on('qr', (qr) => {
			qrcode.generate(qr, { small: true });
			console.log('QR RECEIVED. Scan it with your WhatsApp app.');
		});

		client.on('ready', () => {
			console.log('WhatsApp client is ready!');
		});

		client.on('message', handleMessage);

		// Initialize and start the client
		await client.initialize();

		return true;
	} catch (error) {
		console.error('Error initializing WhatsApp client:', error);
		return false;
	}
}

// Main message handler
async function handleMessage(message: any) {
	try {
		// Ignore group messages
		if (message.from.includes('@g.us')) return;

		// Get the message body
		const messageBody = message.body;

		// Check if the message is empty
		if (!messageBody || messageBody.trim() === '') return;

		// Get user by phone number
		const phone = message.from.replace('@c.us', '');
		let user = await db.getUserByPhone(phone);

		// Create user if not exists
		if (!user) {
			user = await db.createUser(phone);
			if (!user) {
				await message.reply('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.');
				return;
			}

			// Send welcome message
			await message.reply(
				`Olá! Bem-vindo ao EconomiZap! 🎉\n\nSou seu assistente financeiro pessoal. Você pode:\n\n✅ Registrar gastos: "Uber 20"\n📊 Ver análises: "Quanto gastei essa semana?"\n⏰ Criar lembretes: "Conta de luz dia 10, R$150"\n💰 Definir metas: "Quero guardar 5000 para férias"\n\nComo posso ajudar hoje?`
			);
			return;
		}

		// Analyze the message with OpenAI
		const analysis = await analyzeUserMessage(messageBody);

		// Update the WhatsApp session with context
		await db.updateWhatsappSession(
			user.id,
			JSON.stringify({
				lastMessage: messageBody,
				lastAnalysis: analysis,
			})
		);

		// Handle different message types
		switch (analysis.type) {
			case 'expense':
				await handleExpense(message, user.id, analysis.data as any);
				break;

			case 'query':
				await handleQuery(message, user.id, analysis.data as string);
				break;

			case 'bill_reminder':
				await handleBillReminder(message, user.id, analysis.data as any);
				break;

			case 'bill_paid':
				await handleBillPaid(message, user.id, analysis.data as string);
				break;

			case 'savings_goal':
				await handleSavingsGoal(message, user.id, analysis.data as any);
				break;

			case 'unknown':
			default:
				await message.reply('Desculpe, não entendi o que você quis dizer. Pode reformular?');
				break;
		}
	} catch (error) {
		console.error('Error handling message:', error);
		await message.reply('Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
	}
}

// Handler for expense messages
async function handleExpense(
	message: any,
	userId: string,
	expenseData: {
		description: string;
		amount: number;
		category: string;
		paymentMethod?: 'credit' | 'debit' | 'cash' | 'pix' | 'other';
	}
) {
	try {
		// Get categories for this user
		let categories = await db.getCategories(userId);

		// Find the matching category or create a new one
		let category = categories.find((c) => c.name.toLowerCase() === expenseData.category.toLowerCase());

		if (!category) {
			category = await db.createCategory(userId, expenseData.category, getDefaultIconForCategory(expenseData.category));

			if (!category) {
				await message.reply('Ocorreu um erro ao categorizar sua despesa. Por favor, tente novamente.');
				return;
			}
		}

		// Create the expense
		const expense = await db.createExpense(
			userId,
			category.id,
			expenseData.amount,
			expenseData.description,
			expenseData.paymentMethod
		);

		if (!expense) {
			await message.reply('Ocorreu um erro ao registrar sua despesa. Por favor, tente novamente.');
			return;
		}

		// Check if approaching budget limit
		let warningMessage = '';
		if (category.monthly_budget) {
			// Get current month expenses for this category
			const now = new Date();
			const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
			const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

			const expenses = await db.getExpensesByDateRange(userId, startDate, endDate);
			const categoryExpenses = expenses.filter((e) => e.category_id === category!.id);

			const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

			if (totalSpent >= category.monthly_budget * 0.8) {
				warningMessage = `\n\nLembrete: Você está quase chegando no seu limite definido de R$${category.monthly_budget} por mês com ${category.name}.`;
			}
		}

		// Generate the response
		const response = await generateExpenseResponse(
			{
				...expenseData,
				category: category.name,
			},
			category.monthly_budget
		);

		await message.reply(response);
	} catch (error) {
		console.error('Error handling expense:', error);
		await message.reply('Ocorreu um erro ao registrar sua despesa. Por favor, tente novamente.');
	}
}

// Handler for queries
async function handleQuery(message: any, userId: string, queryIntent: string) {
	try {
		if (queryIntent.includes('gastei') && (queryIntent.includes('semana') || queryIntent.includes('últimos dias'))) {
			// Handle expense query for the current week
			await handleWeeklyExpensesQuery(message, userId);
		} else if (queryIntent.includes('limite') || queryIntent.includes('orçamento')) {
			// Handle budget limits query
			await handleBudgetLimitsQuery(message, userId);
		} else if (queryIntent.includes('meta') || queryIntent.includes('guardar') || queryIntent.includes('poupança')) {
			// Handle savings goals query
			await handleSavingsGoalsQuery(message, userId);
		} else {
			await message.reply('Ainda não sei responder esse tipo de pergunta, mas estou aprendendo!');
		}
	} catch (error) {
		console.error('Error handling query:', error);
		await message.reply('Ocorreu um erro ao processar sua consulta. Por favor, tente novamente.');
	}
}

// Handler for weekly expenses query
async function handleWeeklyExpensesQuery(message: any, userId: string) {
	try {
		const today = new Date();

		// Current week date range
		const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 });
		const currentWeekEnd = endOfWeek(today, { weekStartsOn: 0 });

		// Previous week date range
		const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });
		const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 0 });

		// Get expenses for current and previous weeks
		const currentWeekExpenses = await db.getExpensesByDateRange(
			userId,
			currentWeekStart.toISOString(),
			currentWeekEnd.toISOString()
		);

		const previousWeekExpenses = await db.getExpensesByDateRange(
			userId,
			previousWeekStart.toISOString(),
			previousWeekEnd.toISOString()
		);

		// Calculate totals
		const currentWeekTotal = currentWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
		const previousWeekTotal = previousWeekExpenses.reduce((sum, e) => sum + e.amount, 0);

		// Generate chart image for current week expenses
		const chartImage = await formatExpenseChart(currentWeekExpenses);

		// Find significant differences between weeks
		let diffCategory, diffAmount, diffDate;

		if (currentWeekTotal > previousWeekTotal) {
			// Find expenses in current week that weren't in previous week or were significantly higher
			const categoryTotals: Record<string, number> = {};
			const previousCategoryTotals: Record<string, number> = {};

			// Calculate totals by category for both weeks
			currentWeekExpenses.forEach((e) => {
				const category = (e as any).categories?.name || 'Outros';
				categoryTotals[category] = (categoryTotals[category] || 0) + e.amount;
			});

			previousWeekExpenses.forEach((e) => {
				const category = (e as any).categories?.name || 'Outros';
				previousCategoryTotals[category] = (previousCategoryTotals[category] || 0) + e.amount;
			});

			// Find category with biggest difference
			let maxDiff = 0;
			Object.keys(categoryTotals).forEach((category) => {
				const current = categoryTotals[category] || 0;
				const previous = previousCategoryTotals[category] || 0;
				const diff = current - previous;

				if (diff > maxDiff) {
					maxDiff = diff;
					diffCategory = category;
					diffAmount = maxDiff;

					// Find the expense date with this category
					const expense = currentWeekExpenses.find((e) => (e as any).categories?.name === category && e.amount > 0);
					if (expense) {
						diffDate = expense.date;
					}
				}
			});
		}

		// Generate analysis text
		const analysisText = await generateExpensesAnalysis(
			currentWeekTotal,
			previousWeekTotal,
			diffCategory,
			diffAmount,
			diffDate
		);

		// Send the chart and analysis
		if (chartImage) {
			await client.sendMessage(message.from, chartImage, { caption: analysisText });
		} else {
			await message.reply(`Total de gastos nesta semana: R$${currentWeekTotal.toFixed(2)}\n\n${analysisText}`);
		}
	} catch (error) {
		console.error('Error handling weekly expenses query:', error);
		await message.reply('Ocorreu um erro ao gerar a análise de gastos semanais. Por favor, tente novamente.');
	}
}

// Handler for budget limits query
async function handleBudgetLimitsQuery(message: any, userId: string) {
	try {
		// Get categories with budget limits
		const categories = await db.getCategories(userId);
		const categoriesWithBudgets = categories.filter((c) => c.monthly_budget);

		if (categoriesWithBudgets.length === 0) {
			await message.reply(
				'Você ainda não definiu limites de orçamento para nenhuma categoria. Para definir, diga por exemplo: "Definir limite de R$200 para Alimentação".'
			);
			return;
		}

		// Get current month expenses
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
		const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

		const expenses = await db.getExpensesByDateRange(userId, startDate, endDate);

		// Calculate spending by category
		const categorySpending: Record<string, { spent: number; budget: number; category: string }> = {};

		categoriesWithBudgets.forEach((category) => {
			categorySpending[category.id] = {
				spent: 0,
				budget: category.monthly_budget || 0,
				category: category.name,
			};
		});

		expenses.forEach((expense) => {
			if (categorySpending[expense.category_id]) {
				categorySpending[expense.category_id].spent += expense.amount;
			}
		});

		// Generate chart
		const chartImage = await formatExpenseCategoryChart(Object.values(categorySpending));

		if (chartImage) {
			await client.sendMessage(message.from, chartImage, {
				caption: 'Aqui está o progresso dos seus limites de orçamento para o mês atual:',
			});
		} else {
			// Fallback text response
			let response = 'Seus limites de orçamento para o mês atual:\n\n';

			Object.values(categorySpending).forEach(({ category, spent, budget }) => {
				const percentage = (spent / budget) * 100;
				const progressBar = getProgressBar(percentage);
				response += `${category}: ${progressBar} ${percentage.toFixed(0)}%\nR$${spent.toFixed(2)} de R$${budget.toFixed(
					2
				)}\n\n`;
			});

			await message.reply(response);
		}
	} catch (error) {
		console.error('Error handling budget limits query:', error);
		await message.reply('Ocorreu um erro ao consultar seus limites de orçamento. Por favor, tente novamente.');
	}
}

// Handler for savings goals query
async function handleSavingsGoalsQuery(message: any, userId: string) {
	try {
		const goals = await db.getSavingGoals(userId);

		if (goals.length === 0) {
			await message.reply(
				'Você ainda não tem metas de economia definidas. Para criar uma, diga por exemplo: "Quero guardar R$5000 para férias até dezembro".'
			);
			return;
		}

		// Generate chart for the first goal (in a real app, might want to handle multiple goals better)
		const goal = goals[0];
		const percentage = (goal.current_amount / goal.target_amount) * 100;

		const chartImage = await formatSavingsGoalChart(goal);

		if (chartImage) {
			const caption = `Meta: ${goal.name}\nProgresso: ${percentage.toFixed(1)}%\nR$${goal.current_amount.toFixed(
				2
			)} de R$${goal.target_amount.toFixed(2)}`;
			await client.sendMessage(message.from, chartImage, { caption });
		} else {
			// Fallback text response
			let response = 'Suas metas de economia:\n\n';

			goals.forEach((goal) => {
				const percentage = (goal.current_amount / goal.target_amount) * 100;
				const progressBar = getProgressBar(percentage);

				response += `${goal.name}: ${progressBar} ${percentage.toFixed(1)}%\n`;
				response += `R$${goal.current_amount.toFixed(2)} de R$${goal.target_amount.toFixed(2)}\n`;

				if (goal.target_date) {
					const targetDate = new Date(goal.target_date);
					response += `Data alvo: ${targetDate.toLocaleDateString('pt-BR')}\n`;
				}

				response += '\n';
			});

			await message.reply(response);
		}
	} catch (error) {
		console.error('Error handling savings goals query:', error);
		await message.reply('Ocorreu um erro ao consultar suas metas de economia. Por favor, tente novamente.');
	}
}

// Handler for bill reminders
async function handleBillReminder(
	message: any,
	userId: string,
	reminderData: {
		description: string;
		amount?: number;
		dueDate: number;
		frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
	}
) {
	try {
		// Find or create the "Contas" category
		let categories = await db.getCategories(userId);
		let billsCategory = categories.find((c) => c.name === 'Contas');

		if (!billsCategory) {
			billsCategory = await db.createCategory(userId, 'Contas', '📄', undefined);

			if (!billsCategory) {
				await message.reply('Ocorreu um erro ao criar a categoria de contas. Por favor, tente novamente.');
				return;
			}
		}

		// Create the bill reminder
		const bill = await db.createBill(
			userId,
			reminderData.description,
			reminderData.amount || 0,
			reminderData.dueDate,
			reminderData.frequency,
			billsCategory.id
		);

		if (!bill) {
			await message.reply('Ocorreu um erro ao criar o lembrete de conta. Por favor, tente novamente.');
			return;
		}

		// Generate response
		const response = await generateBillReminderResponse(reminderData);
		await message.reply(response);
	} catch (error) {
		console.error('Error handling bill reminder:', error);
		await message.reply('Ocorreu um erro ao criar o lembrete de conta. Por favor, tente novamente.');
	}
}

// Handler for bill paid confirmation
async function handleBillPaid(message: any, userId: string, billDescription: string) {
	try {
		// In a real app, you would mark the bill as paid in the database
		// and update the next due date based on frequency

		await message.reply('Te lembro de novo mês que vem✅');
	} catch (error) {
		console.error('Error handling bill paid:', error);
		await message.reply('Ocorreu um erro ao atualizar o status da conta. Por favor, tente novamente.');
	}
}

// Handler for savings goals
async function handleSavingsGoal(
	message: any,
	userId: string,
	goalData: {
		name: string;
		targetAmount: number;
		initialAmount?: number;
		targetDate?: string;
	}
) {
	try {
		// Create the savings goal
		const goal = await db.createSavingGoal(
			userId,
			goalData.name,
			goalData.targetAmount,
			goalData.initialAmount || 0,
			goalData.targetDate
		);

		if (!goal) {
			await message.reply('Ocorreu um erro ao criar a meta de economia. Por favor, tente novamente.');
			return;
		}

		// Add initial contribution if provided
		if (goalData.initialAmount && goalData.initialAmount > 0) {
			await db.addContributionToGoal(userId, goal.id, goalData.initialAmount);
		}

		// Generate response
		const response = await generateSavingsGoalResponse(goalData);
		await message.reply(response);
	} catch (error) {
		console.error('Error handling savings goal:', error);
		await message.reply('Ocorreu um erro ao criar a meta de economia. Por favor, tente novamente.');
	}
}

// Helper function to get a default icon for a category
function getDefaultIconForCategory(category: string): string {
	const categoryMap: Record<string, string> = {
		Alimentação: '🍽️',
		Transporte: '🚗',
		Moradia: '🏠',
		Saúde: '⚕️',
		Educação: '📚',
		Lazer: '🎮',
		Compras: '🛍️',
		Contas: '📄',
	};

	return categoryMap[category] || '📌';
}

// Helper function to generate a text-based progress bar
function getProgressBar(percentage: number): string {
	const filled = Math.floor(percentage / 10);
	const empty = 10 - filled;

	return '█'.repeat(filled) + '░'.repeat(empty);
}
