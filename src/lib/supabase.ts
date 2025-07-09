import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// Helper functions for database operations

// Users
export async function createUser(phone: string, email?: string) {
	const { data, error } = await supabase
		.from('users')
		.insert([
			{
				phone_number: phone,
				email,
				subscription_status: 'trial',
			},
		])
		.select();

	if (error) {
		console.error('Error creating user:', error);
		return null;
	}

	return data?.[0] || null;
}

export async function getUserByPhone(phone: string) {
	const { data, error } = await supabase.from('users').select('*').eq('phone_number', phone).single();

	if (error) {
		console.error('Error getting user:', error);
		return null;
	}

	return data;
}

// Categories
export async function getCategories(userId: string) {
	const { data, error } = await supabase.from('categories').select('*').eq('user_id', userId);

	if (error) {
		console.error('Error getting categories:', error);
		return [];
	}

	return data || [];
}

export async function createCategory(userId: string, name: string, icon?: string, budget?: number) {
	const { data, error } = await supabase
		.from('categories')
		.insert([
			{
				user_id: userId,
				name,
				icon,
				monthly_budget: budget,
				is_default: false,
			},
		])
		.select();

	if (error) {
		console.error('Error creating category:', error);
		return null;
	}

	return data?.[0] || null;
}

// Expenses
export async function createExpense(
	userId: string,
	categoryId: string,
	amount: number,
	description: string,
	paymentMethod?: 'credit' | 'debit' | 'cash' | 'pix' | 'other'
) {
	const { data, error } = await supabase
		.from('expenses')
		.insert([
			{
				user_id: userId,
				category_id: categoryId,
				amount,
				description,
				date: new Date().toISOString(),
				payment_method: paymentMethod || 'other',
			},
		])
		.select();

	if (error) {
		console.error('Error creating expense:', error);
		return null;
	}

	return data?.[0] || null;
}

export async function getExpensesByDateRange(userId: string, startDate: string, endDate: string) {
	const { data, error } = await supabase
		.from('expenses')
		.select('*, categories(*)')
		.eq('user_id', userId)
		.gte('date', startDate)
		.lte('date', endDate)
		.order('date', { ascending: false });

	if (error) {
		console.error('Error getting expenses:', error);
		return [];
	}

	return data || [];
}

// Bills
export async function createBill(
	userId: string,
	description: string,
	amount: number,
	dueDate: number,
	frequency: 'monthly' | 'yearly' | 'weekly' | 'daily',
	categoryId?: string
) {
	const { data, error } = await supabase
		.from('bills')
		.insert([
			{
				user_id: userId,
				description,
				amount,
				due_date: dueDate,
				frequency,
				category_id: categoryId,
				is_active: true,
			},
		])
		.select();

	if (error) {
		console.error('Error creating bill:', error);
		return null;
	}

	return data?.[0] || null;
}

export async function getBillsDue(userId: string, daysAhead: number = 5) {
	const today = new Date();
	const nextDays = new Date();
	nextDays.setDate(today.getDate() + daysAhead);

	// This is a simplified implementation - a real version would be more complex
	// to handle different frequencies and check the day of month
	const { data, error } = await supabase.from('bills').select('*').eq('user_id', userId).eq('is_active', true);

	if (error) {
		console.error('Error getting bills:', error);
		return [];
	}

	// Filter bills due in the next few days
	// This is a simplified approach
	const currentDay = today.getDate();
	const dueBills = data.filter((bill) => {
		return bill.due_date >= currentDay && bill.due_date <= currentDay + daysAhead;
	});

	return dueBills || [];
}

// Saving Goals
export async function createSavingGoal(
	userId: string,
	name: string,
	targetAmount: number,
	currentAmount: number = 0,
	targetDate?: string
) {
	const { data, error } = await supabase
		.from('saving_goals')
		.insert([
			{
				user_id: userId,
				name,
				target_amount: targetAmount,
				current_amount: currentAmount,
				target_date: targetDate,
				is_active: true,
			},
		])
		.select();

	if (error) {
		console.error('Error creating saving goal:', error);
		return null;
	}

	return data?.[0] || null;
}

export async function addContributionToGoal(userId: string, goalId: string, amount: number) {
	// First add the contribution record
	const { data: contributionData, error: contributionError } = await supabase
		.from('saving_contributions')
		.insert([
			{
				user_id: userId,
				goal_id: goalId,
				amount,
				date: new Date().toISOString(),
			},
		])
		.select();

	if (contributionError) {
		console.error('Error adding contribution:', contributionError);
		return null;
	}

	// Then update the goal's current amount
	const { data: goalData, error: goalError } = await supabase.rpc('increment_goal_amount', {
		p_goal_id: goalId,
		p_amount: amount,
	});

	if (goalError) {
		console.error('Error updating goal amount:', goalError);
		return null;
	}

	return contributionData?.[0] || null;
}

export async function getSavingGoals(userId: string) {
	const { data, error } = await supabase.from('saving_goals').select('*').eq('user_id', userId).eq('is_active', true);

	if (error) {
		console.error('Error getting saving goals:', error);
		return [];
	}

	return data || [];
}

// WhatsApp Session
export async function updateWhatsappSession(userId: string, context?: string) {
	const { data, error } = await supabase
		.from('whatsapp_sessions')
		.upsert([
			{
				user_id: userId,
				last_active: new Date().toISOString(),
				context,
			},
		])
		.select();

	if (error) {
		console.error('Error updating WhatsApp session:', error);
		return null;
	}

	return data?.[0] || null;
}

export async function getWhatsappSession(userId: string) {
	const { data, error } = await supabase.from('whatsapp_sessions').select('*').eq('user_id', userId).single();

	if (error && error.code !== 'PGRST116') {
		// No rows returned
		console.error('Error getting WhatsApp session:', error);
		return null;
	}

	return data || null;
}
