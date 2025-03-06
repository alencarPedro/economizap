'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Define plan options
const plans = [
	{
		id: 'price_basic',
		name: 'Plano Básico',
		price: 'R$ 9,90',
		features: [
			'Acesso ao bot no WhatsApp',
			'Registro de despesas ilimitado',
			'Relatórios básicos mensais',
			'3 metas de economia',
		],
		priceId: 'price_1Oz0PGEm1u2c0dLk9Oz0PGEm', // Replace with your actual Stripe Price ID
	},
	{
		id: 'price_premium',
		name: 'Plano Premium',
		price: 'R$ 19,90',
		features: [
			'Todas as funcionalidades do plano básico',
			'Relatórios detalhados e personalizados',
			'Análise de padrões de gastos com IA',
			'Metas de economia ilimitadas',
			'Suporte prioritário',
		],
		priceId: 'price_1Oz0PGEm1u2c0dLk9Oz0PGEm', // Replace with your actual Stripe Price ID
	},
];

export default function PremiumSubscription() {
	const [selectedPlan, setSelectedPlan] = useState(plans[0]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubscribe = async () => {
		setLoading(true);
		setError('');

		try {
			// Call the API to create a Stripe checkout session
			const response = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					priceId: selectedPlan.priceId,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Erro ao criar sessão de pagamento');
			}

			const { sessionId } = await response.json();

			// Redirect to Stripe Checkout
			const stripe = await stripePromise;
			if (!stripe) throw new Error('Falha ao carregar Stripe');

			const { error: stripeError } = await stripe.redirectToCheckout({
				sessionId,
			});

			if (stripeError) {
				throw new Error(stripeError.message || 'Erro ao redirecionar para o checkout');
			}
		} catch (err) {
			console.error('Error during checkout:', err);
			setError(err instanceof Error ? err.message : 'Ocorreu um erro durante o processo de pagamento');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-4">
			<h2 className="text-2xl font-bold text-center mb-8">Atualize para o Plano Premium</h2>

			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

			<div className="grid md:grid-cols-2 gap-6">
				{plans.map((plan) => (
					<div
						key={plan.id}
						className={`border rounded-lg p-6 cursor-pointer transition-all ${
							selectedPlan.id === plan.id
								? 'border-blue-500 bg-blue-50 shadow-md'
								: 'border-gray-200 hover:border-blue-300'
						}`}
						onClick={() => setSelectedPlan(plan)}>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold">{plan.name}</h3>
							<div className="text-2xl font-bold text-blue-600">
								{plan.price}
								<span className="text-sm text-gray-500">/mês</span>
							</div>
						</div>

						<ul className="space-y-2 mb-6">
							{plan.features.map((feature, index) => (
								<li
									key={index}
									className="flex items-start">
									<svg
										className="h-5 w-5 text-green-500 mr-2 mt-0.5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M5 13l4 4L19 7"></path>
									</svg>
									<span>{feature}</span>
								</li>
							))}
						</ul>

						<div className="flex items-center">
							<input
								type="radio"
								id={plan.id}
								name="plan"
								checked={selectedPlan.id === plan.id}
								onChange={() => setSelectedPlan(plan)}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500"
							/>
							<label
								htmlFor={plan.id}
								className="ml-2 text-sm font-medium text-gray-700">
								Selecionar {plan.name}
							</label>
						</div>
					</div>
				))}
			</div>

			<div className="mt-8 text-center">
				<button
					onClick={handleSubscribe}
					disabled={loading}
					className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all disabled:opacity-50">
					{loading ? 'Processando...' : 'Assinar Agora'}
				</button>
				<p className="mt-2 text-sm text-gray-500">
					Pagamento seguro via Stripe. Você pode cancelar a qualquer momento.
				</p>
			</div>
		</div>
	);
}
