'use client';

import React, { useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Dynamically import charts to reduce initial bundle size
const PieChart = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Pie })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false,
});

const BarChart = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Bar })), {
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded-lg" />,
  ssr: false,
});

// Lazy load smaller components
const ExpenseCard = dynamic(() => import('./ExpenseCard'), {
  loading: () => <div className="animate-pulse h-16 bg-gray-200 rounded" />,
});

const SavingsGoalCard = dynamic(() => import('./SavingsGoalCard'), {
  loading: () => <div className="animate-pulse h-16 bg-gray-200 rounded" />,
});

// Define colors for chart (moved outside component to prevent recreation)
const CHART_COLORS = [
  'rgba(59, 130, 246, 0.8)', // Blue
  'rgba(16, 185, 129, 0.8)', // Green
  'rgba(245, 101, 101, 0.8)', // Red
  'rgba(251, 191, 36, 0.8)', // Yellow
  'rgba(139, 92, 246, 0.8)', // Purple
  'rgba(236, 72, 153, 0.8)', // Pink
  'rgba(6, 182, 212, 0.8)', // Cyan
  'rgba(34, 197, 94, 0.8)', // Emerald
];

// Types
interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
}

interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  created_at: string;
}

interface DashboardData {
  balance: number;
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  allExpenses: Expense[];
}

// Optimized data fetching function
const fetchDashboardData = async (): Promise<DashboardData> => {
  const supabase = getSupabaseClient();
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  // Get user profile with balance
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, balance')
    .eq('auth_id', user.id)
    .single();

  if (userError) throw userError;

  // Parallel queries for better performance
  const [expensesResult, goalsResult, allExpensesResult] = await Promise.all([
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false }),
    
    supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userData.id)
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  if (expensesResult.error) throw expensesResult.error;
  if (goalsResult.error) throw goalsResult.error;
  if (allExpensesResult.error) throw allExpensesResult.error;

  return {
    balance: userData.balance || 0,
    expenses: expensesResult.data || [],
    savingsGoals: goalsResult.data || [],
    allExpenses: allExpensesResult.data || [],
  };
};

export default function OptimizedDashboard() {
  // Use React Query for optimized data fetching with caching
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Memoized calculations to prevent unnecessary re-computations
  const expensesByCategory = useMemo(() => {
    if (!data?.allExpenses) return {};
    
    return data.allExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [data?.allExpenses]);

  const monthlyExpenses = useMemo(() => {
    if (!data?.allExpenses) return {};
    
    const byMonth: Record<string, number> = {};
    const today = new Date();

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = month.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });
      byMonth[monthKey] = 0;
    }

    data.allExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.created_at);
      const monthKey = expenseDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });

      if (byMonth[monthKey] !== undefined) {
        byMonth[monthKey] += expense.amount;
      }
    });

    return byMonth;
  }, [data?.allExpenses]);

  // Memoized chart data to prevent recreation on every render
  const pieData = useMemo(() => {
    const categories = Object.keys(expensesByCategory);
    const values = Object.values(expensesByCategory);
    
    return {
      labels: categories,
      datasets: [
        {
          data: values,
          backgroundColor: CHART_COLORS.slice(0, categories.length),
          borderWidth: 2,
          borderColor: '#ffffff',
        },
      ],
    };
  }, [expensesByCategory]);

  const barData = useMemo(() => {
    const months = Object.keys(monthlyExpenses).reverse();
    const values = Object.values(monthlyExpenses).reverse();
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Despesas Mensais',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
      ],
    };
  }, [monthlyExpenses]);

  // Memoized chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
  }), []);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }), []);

  // Render expense cards with useCallback to prevent recreation
  const renderExpenseCards = useCallback(() => {
    if (!data?.expenses?.length) {
      return <p className="text-gray-500 text-center py-8">Nenhuma despesa registrada</p>;
    }

    return data.expenses.map((expense) => (
      <ExpenseCard
        key={expense.id}
        category={expense.category}
        description={expense.description}
        amount={expense.amount}
        date={new Date(expense.created_at).toLocaleDateString('pt-BR')}
      />
    ));
  }, [data?.expenses]);

  const renderSavingsGoalCards = useCallback(() => {
    if (!data?.savingsGoals?.length) {
      return <p className="text-gray-500 text-center py-8">Nenhuma meta de economia definida</p>;
    }

    return data.savingsGoals.map((goal) => (
      <SavingsGoalCard
        key={goal.id}
        name={goal.name}
        currentAmount={goal.current_amount}
        targetAmount={goal.target_amount}
        targetDate={goal.target_date ? new Date(goal.target_date).toLocaleDateString('pt-BR') : undefined}
      />
    ));
  }, [data?.savingsGoals]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar dados do dashboard</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 btn btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Saldo Atual</h3>
          <p className="text-3xl font-bold text-blue-600">
            R$ {data?.balance?.toFixed(2).replace('.', ',') || '0,00'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Despesas</h3>
          <p className="text-3xl font-bold text-red-500">
            R$ {totalExpenses.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Metas de Economia</h3>
          <p className="text-3xl font-bold text-green-500">{data?.savingsGoals?.length || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Despesas por Categoria</h3>
          <div className="h-64">
            {Object.keys(expensesByCategory).length > 0 ? (
              <PieChart data={pieData} options={chartOptions} />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">Nenhuma despesa registrada</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Despesas Mensais</h3>
          <div className="h-64">
            <BarChart data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Despesas Recentes</h3>
          <div className="space-y-4">
            {renderExpenseCards()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Metas de Economia</h3>
          <div className="space-y-4">
            {renderSavingsGoalCards()}
          </div>
        </div>
      </div>
    </div>
  );
}