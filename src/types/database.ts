export interface User {
	id: string;
	email: string;
	phone_number: string;
	created_at: string;
	subscription_status: 'active' | 'inactive' | 'trial';
	subscription_end_date?: string;
}

export interface Category {
	id: string;
	name: string;
	user_id: string;
	monthly_budget?: number;
	icon?: string;
	created_at: string;
	is_default: boolean;
}

export interface Expense {
	id: string;
	user_id: string;
	category_id: string;
	amount: number;
	description: string;
	date: string;
	payment_method?: 'credit' | 'debit' | 'cash' | 'pix' | 'other';
	created_at: string;
}

export interface Bill {
	id: string;
	user_id: string;
	description: string;
	amount: number;
	due_date: number; // Day of month
	frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
	category_id?: string;
	created_at: string;
	last_reminder_sent?: string;
	next_due_date?: string;
	is_active: boolean;
}

export interface SavingGoal {
	id: string;
	user_id: string;
	name: string;
	target_amount: number;
	current_amount: number;
	target_date?: string;
	created_at: string;
	is_active: boolean;
}

export interface SavingContribution {
	id: string;
	goal_id: string;
	user_id: string;
	amount: number;
	date: string;
	created_at: string;
}

export interface WhatsappSession {
	id: string;
	user_id: string;
	last_active: string;
	context?: string;
}

export interface DefaultCategories {
	name: string;
	icon: string;
	is_default: boolean;
}

export const DEFAULT_CATEGORIES: DefaultCategories[] = [
	{ name: 'Alimentação', icon: '🍽️', is_default: true },
	{ name: 'Transporte', icon: '🚗', is_default: true },
	{ name: 'Moradia', icon: '🏠', is_default: true },
	{ name: 'Saúde', icon: '⚕️', is_default: true },
	{ name: 'Educação', icon: '📚', is_default: true },
	{ name: 'Lazer', icon: '🎮', is_default: true },
	{ name: 'Compras', icon: '🛍️', is_default: true },
	{ name: 'Contas', icon: '📄', is_default: true },
	{ name: 'Outros', icon: '📌', is_default: true },
];
