'use client';

import React, { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface AddExpenseFormProps {
	onSuccess?: () => void;
}

export default function AddExpenseForm({ onSuccess }: AddExpenseFormProps) {
	const supabase = getSupabaseClient();
	const [description, setDescription] = useState('');
	const [amount, setAmount] = useState('');
	const [category, setCategory] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const categories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Outros'];

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			// Validate inputs
			if (!description.trim()) {
				throw new Error('Descrição é obrigatória');
			}

			const amountValue = parseFloat(amount.replace(',', '.'));
			if (isNaN(amountValue) || amountValue <= 0) {
				throw new Error('Valor inválido');
			}

			if (!category) {
				throw new Error('Categoria é obrigatória');
			}

			// Get current user
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error('Usuário não autenticado');
			}

			// Get user profile
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('auth_id', user.id)
				.single();

			if (userError) throw userError;

			// Add expense
			const { error: expenseError } = await supabase.from('expenses').insert({
				user_id: userData.id,
				description,
				amount: amountValue,
				category,
				created_at: new Date().toISOString(),
			});

			if (expenseError) throw expenseError;

			// Update user balance
			const { error: balanceError } = await supabase.rpc('update_user_balance', {
				user_id_param: userData.id,
				amount_param: -amountValue,
			});

			if (balanceError) throw balanceError;

			// Reset form
			setDescription('');
			setAmount('');
			setCategory('');

			// Call success callback
			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro ao adicionar despesa');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<h3 className="text-lg font-semibold text-gray-700 mb-4">Adicionar Despesa</h3>

			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700 mb-1">
						Descrição
					</label>
					<input
						type="text"
						id="description"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Ex: Supermercado"
						disabled={loading}
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="amount"
						className="block text-sm font-medium text-gray-700 mb-1">
						Valor (R$)
					</label>
					<input
						type="text"
						id="amount"
						value={amount}
						onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Ex: 50,00"
						disabled={loading}
					/>
				</div>

				<div className="mb-6">
					<label
						htmlFor="category"
						className="block text-sm font-medium text-gray-700 mb-1">
						Categoria
					</label>
					<select
						id="category"
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}>
						<option value="">Selecione uma categoria</option>
						{categories.map((cat) => (
							<option
								key={cat}
								value={cat}>
								{cat}
							</option>
						))}
					</select>
				</div>

				<button
					type="submit"
					className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
					disabled={loading}>
					{loading ? 'Adicionando...' : 'Adicionar Despesa'}
				</button>
			</form>
		</div>
	);
}
