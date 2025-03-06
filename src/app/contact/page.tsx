'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			// In a real app, this would send the form data to an API endpoint
			// const response = await fetch('/api/contact', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ name, email, message }),
			// });

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setSuccess(true);
			setName('');
			setEmail('');
			setMessage('');
		} catch (err) {
			setError('Ocorreu um erro ao enviar sua mensagem. Tente novamente.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="bg-white shadow">
				<div className="container mx-auto px-4 py-4">
					<Link
						href="/"
						className="text-2xl font-bold text-blue-600">
						EconomiZap
					</Link>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<h1 className="text-3xl font-bold mb-6 text-center">Entre em Contato</h1>

					{success ? (
						<div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg mb-8 text-center">
							<div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
								✓
							</div>
							<h2 className="text-xl font-semibold mb-2">Mensagem Enviada!</h2>
							<p className="mb-4">Obrigado por entrar em contato. Responderemos o mais breve possível.</p>
							<button
								onClick={() => setSuccess(false)}
								className="text-blue-600 hover:underline">
								Enviar outra mensagem
							</button>
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-md p-6 mb-8">
							{error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

							<form onSubmit={handleSubmit}>
								<div className="mb-4">
									<label
										htmlFor="name"
										className="block text-gray-700 mb-2">
										Nome
									</label>
									<input
										type="text"
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										className="form-input w-full"
										required
									/>
								</div>

								<div className="mb-4">
									<label
										htmlFor="email"
										className="block text-gray-700 mb-2">
										E-mail
									</label>
									<input
										type="email"
										id="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="form-input w-full"
										required
									/>
								</div>

								<div className="mb-6">
									<label
										htmlFor="message"
										className="block text-gray-700 mb-2">
										Mensagem
									</label>
									<textarea
										id="message"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										className="form-input w-full h-32"
										required></textarea>
								</div>

								<button
									type="submit"
									className="btn btn-primary w-full"
									disabled={loading}>
									{loading ? 'Enviando...' : 'Enviar Mensagem'}
								</button>
							</form>
						</div>
					)}

					<div className="bg-white rounded-lg shadow-md p-6">
						<h2 className="text-xl font-semibold mb-4">Outras Formas de Contato</h2>

						<div className="space-y-4">
							<div className="flex items-center">
								<div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
									✉️
								</div>
								<div>
									<p className="font-medium">E-mail</p>
									<p className="text-gray-600">contato@economizap.com.br</p>
								</div>
							</div>

							<div className="flex items-center">
								<div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-4">
									📱
								</div>
								<div>
									<p className="font-medium">WhatsApp</p>
									<p className="text-gray-600">(11) 99999-9999</p>
								</div>
							</div>

							<div className="flex items-center">
								<div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-4">
									🏢
								</div>
								<div>
									<p className="font-medium">Endereço</p>
									<p className="text-gray-600">Av. Paulista, 1000 - São Paulo, SP</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			<footer className="bg-white py-6 mt-8">
				<div className="container mx-auto px-4 text-center text-gray-500 text-sm">
					<p>EconomiZap - Seu assistente financeiro no WhatsApp</p>
					<p className="mt-2">© {new Date().getFullYear()} EconomiZap. Todos os direitos reservados.</p>
				</div>
			</footer>
		</div>
	);
}
