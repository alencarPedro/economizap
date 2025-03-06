'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Register() {
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			// This would actually call an API endpoint
			// const response = await fetch('/api/register', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ phone, email }),
			// });

			// if (!response.ok) throw new Error('Falha no registro');

			// Simulate API call for now
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setSuccess(true);
		} catch (err) {
			setError('Ocorreu um erro ao processar seu registro. Tente novamente.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const formatPhone = (value: string) => {
		// Keep only numbers
		const numbers = value.replace(/\D/g, '');

		// Format as Brazilian phone number (xx) xxxxx-xxxx
		if (numbers.length <= 2) {
			return numbers;
		} else if (numbers.length <= 7) {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
		} else {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
		}
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPhone(formatPhone(e.target.value));
	};

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="card max-w-md w-full text-center">
					<div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
						✓
					</div>
					<h1 className="text-2xl font-bold mb-4">Registro Concluído!</h1>
					<p className="mb-6 text-gray-600">
						Em breve você receberá uma mensagem no WhatsApp para começar a usar o EconomiZap.
					</p>
					<Link
						href="/"
						className="btn btn-primary inline-block">
						Voltar para a Página Inicial
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<div className="card max-w-md w-full">
				<h1 className="text-2xl font-bold mb-6 text-center">Comece a usar o EconomiZap</h1>

				{error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							htmlFor="phone"
							className="block text-gray-700 mb-2">
							Número do WhatsApp
						</label>
						<input
							type="tel"
							id="phone"
							value={phone}
							onChange={handlePhoneChange}
							className="form-input w-full"
							placeholder="(00) 00000-0000"
							required
						/>
						<p className="text-sm text-gray-500 mt-1">Usaremos este número para enviar o acesso ao bot.</p>
					</div>

					<div className="mb-6">
						<label
							htmlFor="email"
							className="block text-gray-700 mb-2">
							E-mail (opcional)
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="form-input w-full"
							placeholder="seuemail@exemplo.com"
						/>
					</div>

					<button
						type="submit"
						className="btn btn-primary w-full"
						disabled={loading}>
						{loading ? 'Processando...' : 'Registrar'}
					</button>
				</form>

				<p className="text-sm text-gray-500 mt-4 text-center">
					Ao se registrar, você concorda com nossos{' '}
					<Link
						href="/terms"
						className="text-blue-600 hover:underline">
						Termos de Uso
					</Link>{' '}
					e{' '}
					<Link
						href="/privacy"
						className="text-blue-600 hover:underline">
						Política de Privacidade
					</Link>
					.
				</p>
			</div>
		</div>
	);
}
