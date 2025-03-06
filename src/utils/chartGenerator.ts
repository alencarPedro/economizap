import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense, SavingGoal } from '../types/database';

// Configure the chart canvas
const width = 800;
const height = 400;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
	width,
	height,
	backgroundColour: 'white',
	plugins: {
		modern: ['chartjs-plugin-datalabels'],
	},
});

/**
 * Creates a chart showing expenses by day for the current week
 */
export async function formatExpenseChart(expenses: Expense[]): Promise<Buffer | null> {
	try {
		if (expenses.length === 0) {
			return null;
		}

		// Determine the date range (current week)
		const today = new Date();
		const start = startOfWeek(today, { weekStartsOn: 0 });
		const end = endOfWeek(today, { weekStartsOn: 0 });

		// Generate all days in the interval
		const daysInWeek = eachDayOfInterval({ start, end });

		// Initialize data structure for chart
		const labels = daysInWeek.map((day) => format(day, 'EEE', { locale: ptBR }));
		const data = daysInWeek.map((day) => {
			return expenses
				.filter((expense) => {
					const expenseDate = parseISO(expense.date);
					return isSameDay(expenseDate, day);
				})
				.reduce((sum, expense) => sum + expense.amount, 0);
		});

		// Create the chart configuration
		const configuration = {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Gastos Diários (R$)',
						data,
						backgroundColor: 'rgba(54, 162, 235, 0.6)',
						borderColor: 'rgba(54, 162, 235, 1)',
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Gastos da Semana',
						font: {
							size: 18,
						},
					},
					datalabels: {
						anchor: 'end',
						align: 'top',
						formatter: (value: number) => {
							return value > 0 ? `R$${value.toFixed(2)}` : '';
						},
						font: {
							weight: 'bold',
						},
					},
					legend: {
						display: true,
						position: 'top',
					},
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value: number) => `R$${value}`,
						},
					},
				},
			},
		};

		// Generate and return the chart
		// @ts-ignore - Type mismatch in the chartjs library
		return await chartJSNodeCanvas.renderToBuffer(configuration);
	} catch (error) {
		console.error('Error generating expense chart:', error);
		return null;
	}
}

/**
 * Creates a chart showing category spending vs budget
 */
export async function formatExpenseCategoryChart(
	categoryData: Array<{ category: string; spent: number; budget: number }>
): Promise<Buffer | null> {
	try {
		if (categoryData.length === 0) {
			return null;
		}

		// Sort categories by percentage of budget used
		categoryData.sort((a, b) => b.spent / b.budget - a.spent / a.budget);

		// Initialize data structure for chart
		const labels = categoryData.map((item) => item.category);
		const spentData = categoryData.map((item) => item.spent);
		const budgetData = categoryData.map((item) => item.budget);
		const percentages = categoryData.map((item) => (item.spent / item.budget) * 100);

		// Create the chart configuration
		const configuration = {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Gasto (R$)',
						data: spentData,
						backgroundColor: percentages.map((p) =>
							p > 100 ? 'rgba(255, 99, 132, 0.6)' : p > 80 ? 'rgba(255, 159, 64, 0.6)' : 'rgba(75, 192, 192, 0.6)'
						),
						borderColor: percentages.map((p) =>
							p > 100 ? 'rgba(255, 99, 132, 1)' : p > 80 ? 'rgba(255, 159, 64, 1)' : 'rgba(75, 192, 192, 1)'
						),
						borderWidth: 1,
					},
					{
						label: 'Orçamento (R$)',
						data: budgetData,
						type: 'line',
						fill: false,
						borderColor: 'rgba(54, 162, 235, 1)',
						borderWidth: 2,
						pointBackgroundColor: 'rgba(54, 162, 235, 1)',
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Orçamento por Categoria',
						font: {
							size: 18,
						},
					},
					datalabels: {
						anchor: 'end',
						align: 'top',
						formatter: (value: number, context: any) => {
							if (context.datasetIndex === 0) {
								const percentage = percentages[context.dataIndex];
								return `${percentage.toFixed(0)}%`;
							}
							return '';
						},
						font: {
							weight: 'bold',
						},
					},
					legend: {
						display: true,
						position: 'top',
					},
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value: number) => `R$${value}`,
						},
					},
				},
			},
		};

		// Generate and return the chart
		// @ts-ignore - Type mismatch in the chartjs library
		return await chartJSNodeCanvas.renderToBuffer(configuration);
	} catch (error) {
		console.error('Error generating category chart:', error);
		return null;
	}
}

/**
 * Creates a chart showing progress towards a savings goal
 */
export async function formatSavingsGoalChart(goal: SavingGoal): Promise<Buffer | null> {
	try {
		// Calculate percentage
		const percentage = (goal.current_amount / goal.target_amount) * 100;
		const remaining = goal.target_amount - goal.current_amount;

		// Create the chart configuration
		const configuration = {
			type: 'doughnut',
			data: {
				labels: ['Guardado', 'Falta'],
				datasets: [
					{
						data: [goal.current_amount, remaining],
						backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(220, 220, 220, 0.6)'],
						borderColor: ['rgba(75, 192, 192, 1)', 'rgba(220, 220, 220, 1)'],
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: `Meta: ${goal.name}`,
						font: {
							size: 18,
						},
					},
					subtitle: {
						display: true,
						text: `R$${goal.current_amount.toFixed(2)} de R$${goal.target_amount.toFixed(2)} (${percentage.toFixed(
							1
						)}%)`,
						font: {
							size: 14,
						},
					},
					datalabels: {
						formatter: (value: number, context: any) => {
							const sum = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
							const percentage = (value / sum) * 100;
							return percentage > 5 ? `${percentage.toFixed(1)}%` : '';
						},
						font: {
							weight: 'bold',
						},
						color: '#fff',
					},
				},
			},
		};

		// Generate and return the chart
		// @ts-ignore - Type mismatch in the chartjs library
		return await chartJSNodeCanvas.renderToBuffer(configuration);
	} catch (error) {
		console.error('Error generating savings goal chart:', error);
		return null;
	}
}
