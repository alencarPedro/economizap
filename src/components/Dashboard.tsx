'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import ExpenseCard from './ExpenseCard';
import SavingsGoalCard from './SavingsGoalCard';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Define colors for chart
const chartColors = [
	'rgba(255, 99, 132, 0.7)',
	'rgba(54, 162, 235, 0.7)',
	'rgba(255, 206, 86, 0.7)',
	'rgba(75, 192, 192, 0.7)',
	'rgba(153, 102, 255, 0.7)',
	'rgba(255, 159, 64, 0.7)',
	'rgba(199, 199, 199, 0.7)',
	'rgba(83, 102, 255, 0.7)',
	'rgba(78, 252, 3, 0.7)',
	'rgba(252, 3, 198, 0.7)',
];

// Define types for expenses and goals
interface Expense {
	id: string;
	user_id: string;
	description: string;
	amount: number;
	category: string;
	created_at: string;
	updated_at: string;
}

interface SavingsGoal {
	id: string;
	user_id: string;
	name: string;
	target_amount: number;
	current_amount: number;
	target_date?: string;
	created_at: string;
	updated_at: string;
}

export default function Dashboard() {
	const supabase = createClientComponentClient();
	const [balance, setBalance] = useState<number>(0);
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [expensesByCategory, setExpensesByCategory] = useState<{ [key: string]: number }>({});
	const [monthlyExpenses, setMonthlyExpenses] = useState<{ [key: string]: number }>({});

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);

			try {
				// Get user data
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) {
					setLoading(false);
					return;
				}

				// Get user profile with balance
				const { data: userData, error: userError } = await supabase
					.from('users')
					.select('*')
					.eq('auth_id', user.id)
					.single();

				if (userError) throw userError;

				if (userData) {
					setBalance(userData.balance || 0);

					// Get recent expenses
					const { data: expensesData, error: expensesError } = await supabase
						.from('expenses')
						.select('*')
						.eq('user_id', userData.id)
						.order('created_at', { ascending: false })
						.limit(5);

					if (expensesError) throw expensesError;
					setExpenses(expensesData || []);

					// Get savings goals
					const { data: goalsData, error: goalsError } = await supabase
						.from('savings_goals')
						.select('*')
						.eq('user_id', userData.id)
						.order('created_at', { ascending: false });

					if (goalsError) throw goalsError;
					setSavingsGoals(goalsData || []);

					// Calculate expenses by category
					const { data: allExpenses, error: allExpensesError } = await supabase
						.from('expenses')
						.select('*')
						.eq('user_id', userData.id);

					if (allExpensesError) throw allExpensesError;

					// Group by category
					const byCategory: { [key: string]: number } = {};
					allExpenses?.forEach((expense: Expense) => {
						if (!byCategory[expense.category]) {
							byCategory[expense.category] = 0;
						}
						byCategory[expense.category] += expense.amount;
					});
					setExpensesByCategory(byCategory);

					// Group by month (last 6 months)
					const byMonth: { [key: string]: number } = {};
					const today = new Date();

					for (let i = 0; i < 6; i++) {
						const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
						const monthKey = month.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
						byMonth[monthKey] = 0;
					}

					allExpenses?.forEach((expense: Expense) => {
						const expenseDate = new Date(expense.created_at);
						const monthKey = expenseDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });

						if (byMonth[monthKey] !== undefined) {
							byMonth[monthKey] += expense.amount;
						}
					});

					setMonthlyExpenses(byMonth);
				}
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [supabase]);

	// Prepare pie chart data
	const pieData = {
		labels: Object.keys(expensesByCategory),
		datasets: [
			{
				data: Object.values(expensesByCategory),
				backgroundColor: chartColors.slice(0, Object.keys(expensesByCategory).length),
				borderWidth: 1,
			},
		],
	};

	// Prepare bar chart data
	const barData = {
		labels: Object.keys(monthlyExpenses).reverse(),
		datasets: [
			{
				label: 'Despesas Mensais',
				data: Object.values(monthlyExpenses).reverse(),
				backgroundColor: 'rgba(54, 162, 235, 0.7)',
			},
		],
	};

	const barOptions = {
		responsive: true,
		plugins: {
			legend: {
				position: 'top' as const,
			},
			title: {
				display: true,
				text: 'Despesas por Mês',
			},
		},
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				{/* Balance Card */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-2">Saldo Atual</h3>
					<p className="text-3xl font-bold text-blue-600">R$ {balance.toFixed(2).replace('.', ',')}</p>
				</div>

				{/* Total Expenses Card */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Despesas</h3>
					<p className="text-3xl font-bold text-red-500">
						R${' '}
						{Object.values(expensesByCategory)
							.reduce((a, b) => a + b, 0)
							.toFixed(2)
							.replace('.', ',')}
					</p>
				</div>

				{/* Savings Goals Card */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-2">Metas de Economia</h3>
					<p className="text-3xl font-bold text-green-500">{savingsGoals.length}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
				{/* Expenses by Category Chart */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-4">Despesas por Categoria</h3>
					<div className="h-64">
						{Object.keys(expensesByCategory).length > 0 ? (
							<Pie data={pieData} />
						) : (
							<div className="flex justify-center items-center h-full">
								<p className="text-gray-500">Nenhuma despesa registrada</p>
							</div>
						)}
					</div>
				</div>

				{/* Monthly Expenses Chart */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-4">Despesas Mensais</h3>
					<div className="h-64">
						<Bar
							options={barOptions}
							data={barData}
						/>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Recent Expenses */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-4">Despesas Recentes</h3>
					{expenses.length > 0 ? (
						<div className="space-y-4">
							{expenses.map((expense) => (
								<ExpenseCard
									key={expense.id}
									category={expense.category}
									description={expense.description}
									amount={expense.amount}
									date={new Date(expense.created_at).toLocaleDateString('pt-BR')}
								/>
							))}
						</div>
					) : (
						<p className="text-gray-500">Nenhuma despesa registrada</p>
					)}
				</div>

				{/* Savings Goals */}
				<div className="bg-white rounded-lg shadow-md p-6">
					<h3 className="text-lg font-semibold text-gray-700 mb-4">Metas de Economia</h3>
					{savingsGoals.length > 0 ? (
						<div className="space-y-4">
							{savingsGoals.map((goal) => (
								<SavingsGoalCard
									key={goal.id}
									name={goal.name}
									currentAmount={goal.current_amount}
									targetAmount={goal.target_amount}
									targetDate={goal.target_date ? new Date(goal.target_date).toLocaleDateString('pt-BR') : undefined}
								/>
							))}
						</div>
					) : (
						<p className="text-gray-500">Nenhuma meta de economia definida</p>
					)}
				</div>
			</div>
		</div>
	);
}
