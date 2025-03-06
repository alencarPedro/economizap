'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface AddSavingsGoalFormProps {
	onSuccess?: () => void;
}

export default function AddSavingsGoalForm({ onSuccess }: AddSavingsGoalFormProps) {
	const supabase = createClientComponentClient();
	const [name, setName] = useState('');
	const [targetAmount, setTargetAmount] = useState('');
	const [targetDate, setTargetDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			// Validate inputs
			if (!name.trim()) {
				throw new Error('Nome da meta é obrigatório');
			}

			const targetAmountValue = parseFloat(targetAmount.replace(',', '.'));
			if (isNaN(targetAmountValue) || targetAmountValue <= 0) {
				throw new Error('Valor da meta inválido');
			}

			let targetDateISO: string | null = null;
			if (targetDate) {
				const dateObj = new Date(targetDate);
				if (isNaN(dateObj.getTime())) {
					throw new Error('Data inválida');
				}
				targetDateISO = dateObj.toISOString();
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

			// Add savings goal
			const { error: goalError } = await supabase.from('savings_goals').insert({
				user_id: userData.id,
				name,
				target_amount: targetAmountValue,
				current_amount: 0,
				target_date: targetDateISO,
				created_at: new Date().toISOString(),
			});

			if (goalError) throw goalError;

			// Reset form
			setName('');
			setTargetAmount('');
			setTargetDate('');

			// Call success callback
			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro ao adicionar meta');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<h3 className="text-lg font-semibold text-gray-700 mb-4">Adicionar Meta de Economia</h3>

			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-1">
						Nome da Meta
					</label>
					<input
						type="text"
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Ex: Viagem para a praia"
						disabled={loading}
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="targetAmount"
						className="block text-sm font-medium text-gray-700 mb-1">
						Valor da Meta (R$)
					</label>
					<input
						type="text"
						id="targetAmount"
						value={targetAmount}
						onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9,]/g, ''))}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Ex: 1000,00"
						disabled={loading}
					/>
				</div>

				<div className="mb-6">
					<label
						htmlFor="targetDate"
						className="block text-sm font-medium text-gray-700 mb-1">
						Data Limite (opcional)
					</label>
					<input
						type="date"
						id="targetDate"
						value={targetDate}
						onChange={(e) => setTargetDate(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						disabled={loading}
					/>
				</div>

				<button
					type="submit"
					className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
					disabled={loading}>
					{loading ? 'Adicionando...' : 'Adicionar Meta'}
				</button>
			</form>
		</div>
	);
}
