'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ManageSubscription() {
	const supabase = createClientComponentClient();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [subscription, setSubscription] = useState<any>(null);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [cancelError, setCancelError] = useState('');
	const [cancelSuccess, setCancelSuccess] = useState(false);

	useEffect(() => {
		const fetchSubscription = async () => {
			setLoading(true);
			setError('');

			try {
				// Get current user
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) {
					throw new Error('Usuário não autenticado');
				}

				// Get user profile with subscription details
				const { data: userData, error: userError } = await supabase
					.from('users')
					.select('stripe_customer_id, subscription_id, subscription_status, plan_id, payment_status')
					.eq('auth_id', user.id)
					.single();

				if (userError) throw userError;

				if (userData && userData.subscription_id) {
					setSubscription({
						id: userData.subscription_id,
						status: userData.subscription_status,
						planId: userData.plan_id,
						paymentStatus: userData.payment_status,
					});
				}
			} catch (err) {
				console.error('Error fetching subscription:', err);
				setError('Não foi possível carregar os detalhes da assinatura');
			} finally {
				setLoading(false);
			}
		};

		fetchSubscription();
	}, [supabase]);

	const handleCancelSubscription = async () => {
		setCancelLoading(true);
		setCancelError('');
		setCancelSuccess(false);

		try {
			if (!subscription?.id) {
				throw new Error('ID da assinatura não encontrado');
			}

			// Call API to cancel subscription
			const response = await fetch('/api/cancel-subscription', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					subscriptionId: subscription.id,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Erro ao cancelar assinatura');
			}

			setCancelSuccess(true);

			// Update local subscription state
			setSubscription({
				...subscription,
				status: 'canceled',
			});
		} catch (err) {
			console.error('Error canceling subscription:', err);
			setCancelError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura');
		} finally {
			setCancelLoading(false);
		}
	};

	const handleUpdatePaymentMethod = async () => {
		setLoading(true);
		setError('');

		try {
			// Call API to create a billing portal session
			const response = await fetch('/api/create-billing-portal', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Erro ao criar sessão do portal de pagamento');
			}

			const { url } = await response.json();

			// Redirect to the billing portal
			window.location.href = url;
		} catch (err) {
			console.error('Error creating billing portal session:', err);
			setError(err instanceof Error ? err.message : 'Erro ao acessar portal de pagamento');
		} finally {
			setLoading(false);
		}
	};

	const getPlanName = (planId: string) => {
		if (planId.includes('basic')) return 'Plano Básico';
		if (planId.includes('premium')) return 'Plano Premium';
		return 'Plano Desconhecido';
	};

	const getStatusDisplay = (status: string) => {
		switch (status) {
			case 'active':
				return { text: 'Ativa', color: 'text-green-600' };
			case 'canceled':
				return { text: 'Cancelada', color: 'text-red-600' };
			case 'past_due':
				return { text: 'Pagamento Pendente', color: 'text-yellow-600' };
			default:
				return { text: status, color: 'text-gray-600' };
		}
	};

	if (loading) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-lg font-semibold text-gray-700 mb-4">Detalhes da Assinatura</h3>
				<div className="flex justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-lg font-semibold text-gray-700 mb-4">Detalhes da Assinatura</h3>
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
			</div>
		);
	}

	if (!subscription) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6">
				<h3 className="text-lg font-semibold text-gray-700 mb-4">Detalhes da Assinatura</h3>
				<p className="text-gray-600 mb-4">Você não possui uma assinatura ativa.</p>
				<a
					href="/premium"
					className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all">
					Ver Planos Disponíveis
				</a>
			</div>
		);
	}

	const statusDisplay = getStatusDisplay(subscription.status);

	return (
		<div className="bg-white rounded-lg shadow-md p-6">
			<h3 className="text-lg font-semibold text-gray-700 mb-4">Detalhes da Assinatura</h3>

			{cancelError && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{cancelError}</div>
			)}

			{cancelSuccess && (
				<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
					Sua assinatura foi cancelada com sucesso. Você terá acesso aos recursos premium até o final do período de
					cobrança atual.
				</div>
			)}

			<div className="space-y-4 mb-6">
				<div>
					<span className="text-gray-500 block mb-1">Plano:</span>
					<span className="font-medium">
						{subscription.planId ? getPlanName(subscription.planId) : 'Plano Desconhecido'}
					</span>
				</div>

				<div>
					<span className="text-gray-500 block mb-1">Status:</span>
					<span className={`font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
				</div>

				<div>
					<span className="text-gray-500 block mb-1">ID da Assinatura:</span>
					<span className="font-mono text-sm">{subscription.id}</span>
				</div>
			</div>

			<div className="space-x-4">
				{subscription.status !== 'canceled' && (
					<>
						<button
							onClick={handleUpdatePaymentMethod}
							disabled={loading}
							className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all disabled:opacity-50">
							Gerenciar Método de Pagamento
						</button>

						<button
							onClick={handleCancelSubscription}
							disabled={cancelLoading}
							className="bg-white hover:bg-red-50 text-red-600 border border-red-300 font-medium py-2 px-4 rounded-md transition-all disabled:opacity-50">
							{cancelLoading ? 'Cancelando...' : 'Cancelar Assinatura'}
						</button>
					</>
				)}

				{subscription.status === 'canceled' && (
					<a
						href="/premium"
						className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all">
						Reativar Assinatura
					</a>
				)}
			</div>
		</div>
	);
}
