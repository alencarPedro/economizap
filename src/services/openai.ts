import OpenAI from 'openai';
import { DEFAULT_CATEGORIES } from '../types/database';

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface ExtractedExpense {
	description: string;
	amount: number;
	category: string;
	paymentMethod?: 'credit' | 'debit' | 'cash' | 'pix' | 'other';
}

interface BillReminder {
	description: string;
	amount?: number;
	dueDate: number; // day of month
	frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
}

interface SavingsGoal {
	name: string;
	targetAmount: number;
	initialAmount?: number;
	targetDate?: string;
}

export async function analyzeUserMessage(message: string): Promise<{
	type: 'expense' | 'query' | 'bill_reminder' | 'bill_paid' | 'savings_goal' | 'unknown';
	data?: ExtractedExpense | BillReminder | SavingsGoal | string;
}> {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4-turbo',
			messages: [
				{
					role: 'system',
					content: `Você é um assistente financeiro especializado em analisar mensagens sobre finanças pessoais em português.
          Sua tarefa é categorizar a mensagem e extrair informações relevantes.

          Categorias possíveis:
          1. expense - quando o usuário está registrando um gasto
          2. query - quando o usuário está fazendo uma pergunta ou pedindo informações
          3. bill_reminder - quando o usuário está criando um lembrete de conta para pagar
          4. bill_paid - quando o usuário indica que pagou uma conta
          5. savings_goal - quando o usuário está definindo uma meta de economia
          6. unknown - quando não se enquadra em nenhuma das categorias acima

          Categorias de gastos pré-definidas:
          ${DEFAULT_CATEGORIES.map((c) => `- ${c.name}`).join('\n')}

          Forneça sua resposta em formato JSON com os campos 'type' e 'data'.
          O campo 'data' deve conter um objeto com as informações extraídas, conforme o tipo:

          Para type 'expense':
          {
            "description": "descrição do gasto",
            "amount": valor numérico,
            "category": "categoria apropriada",
            "paymentMethod": "método de pagamento (credit, debit, cash, pix, other)"
          }

          Para type 'bill_reminder':
          {
            "description": "descrição da conta",
            "amount": valor numérico (opcional),
            "dueDate": dia do vencimento (número),
            "frequency": "frequência (monthly, yearly, weekly, daily)"
          }

          Para type 'savings_goal':
          {
            "name": "nome da meta",
            "targetAmount": valor objetivo total,
            "initialAmount": valor inicial já guardado (opcional),
            "targetDate": "data alvo para completar a meta (opcional)"
          }

          Para type 'query' ou 'bill_paid' ou 'unknown':
          Uma string com a intenção do usuário.`,
				},
				{ role: 'user', content: message },
			],
			temperature: 0.1,
			response_format: { type: 'json_object' },
		});

		const result = JSON.parse(response.choices[0].message.content || '{}');
		return result;
	} catch (error) {
		console.error('Error analyzing message with OpenAI:', error);
		return {
			type: 'unknown',
			data: 'Não foi possível analisar sua mensagem. Por favor, tente novamente.',
		};
	}
}

export async function generateExpenseResponse(expense: ExtractedExpense, categoryBudget?: number): Promise<string> {
	try {
		const currentDate = new Date().toLocaleDateString('pt-BR');
		let responseText = `Gasto adicionado\n📌${expense.description.toUpperCase()} (${
			expense.category
		})\nR$ ${expense.amount.toFixed(2)}\n${currentDate}`;

		if (categoryBudget) {
			responseText += `\n\nLembrete: Você está quase chegando no seu limite definido de R$${categoryBudget} por mês com ${expense.category}.`;
		}

		return responseText;
	} catch (error) {
		console.error('Error generating expense response:', error);
		return 'Gasto registrado com sucesso!';
	}
}

export async function generateBillReminderResponse(billReminder: BillReminder): Promise<string> {
	try {
		return `Lembrete adicionado\n📌${billReminder.description}\nData: ${
			billReminder.dueDate
		}\nFrequência: ${getFrequencyInPortuguese(billReminder.frequency)}`;
	} catch (error) {
		console.error('Error generating bill reminder response:', error);
		return 'Lembrete adicionado com sucesso!';
	}
}

export async function generateSavingsGoalResponse(goal: SavingsGoal): Promise<string> {
	try {
		let response = `Criei a meta "${goal.name}" com valor alvo de R$${goal.targetAmount.toFixed(2)}`;

		if (goal.initialAmount && goal.initialAmount > 0) {
			response += ` e já registrei o valor inicial de R$${goal.initialAmount.toFixed(2)}`;
		}

		if (goal.targetDate) {
			response += ` para ser completada até ${new Date(goal.targetDate).toLocaleDateString('pt-BR')}`;
		}

		return response;
	} catch (error) {
		console.error('Error generating savings goal response:', error);
		return 'Meta de economia criada com sucesso!';
	}
}

export async function generateExpensesAnalysis(
	currentWeekTotal: number,
	previousWeekTotal: number,
	diffCategory?: string,
	diffAmount?: number,
	diffDate?: string
): Promise<string> {
	const percentChange =
		previousWeekTotal > 0 ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100 : 100;

	let comparisonText = '';

	if (percentChange > 0) {
		comparisonText = `Os gastos aumentaram nesta semana em comparação com a semana passada, totalizando R$${Math.abs(
			currentWeekTotal - previousWeekTotal
		).toFixed(2)} a mais.`;
	} else if (percentChange < 0) {
		comparisonText = `Os gastos diminuíram nesta semana em comparação com a semana passada, totalizando R$${Math.abs(
			currentWeekTotal - previousWeekTotal
		).toFixed(2)} a menos.`;
	} else {
		comparisonText = 'Os gastos se mantiveram iguais em comparação com a semana passada.';
	}

	if (diffCategory && diffAmount && diffDate) {
		const formattedDate = new Date(diffDate).toLocaleDateString('pt-BR', {
			weekday: 'long',
			day: '2-digit',
			month: '2-digit',
		});
		if (percentChange > 0) {
			comparisonText += `\nO principal motivo foi a compra de ${diffCategory}, realizada na ${formattedDate}, no valor de R$${diffAmount.toFixed(
				2
			)}, o que não ocorreu na semana anterior.`;
		}
	}

	return comparisonText;
}

function getFrequencyInPortuguese(frequency: string): string {
	const map: Record<string, string> = {
		monthly: 'Mensal',
		yearly: 'Anual',
		weekly: 'Semanal',
		daily: 'Diário',
	};

	return map[frequency] || frequency;
}
