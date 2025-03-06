import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
	return (
		<main className="min-h-screen">
			{/* Hero Section */}
			<div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
				<div className="container mx-auto px-4 py-16 md:py-24">
					<div className="flex flex-col md:flex-row items-center justify-between">
						<div className="md:w-1/2 mb-10 md:mb-0">
							<h1 className="text-4xl md:text-5xl font-bold mb-6">Organize suas finanças pelo WhatsApp</h1>
							<p className="text-xl mb-8">
								EconomiZap é um assistente financeiro inteligente que te ajuda a controlar gastos, definir metas e
								economizar dinheiro através de simples mensagens no WhatsApp.
							</p>
							<div className="flex flex-col sm:flex-row gap-4">
								<Link
									href="/register"
									className="btn btn-primary text-center">
									Começar Agora
								</Link>
								<Link
									href="#como-funciona"
									className="btn bg-white text-blue-800 hover:bg-blue-50 text-center">
									Como Funciona
								</Link>
							</div>
						</div>
						<div className="md:w-1/2 flex justify-center">
							<div className="relative w-64 h-96 md:w-80 md:h-[32rem] bg-white rounded-3xl shadow-xl p-4 overflow-hidden">
								<div className="absolute top-0 left-0 right-0 h-8 bg-green-500 flex items-center px-4 rounded-t-3xl">
									<div className="w-2 h-2 rounded-full bg-white mr-1 opacity-50"></div>
									<div className="w-2 h-2 rounded-full bg-white mr-1 opacity-50"></div>
									<div className="w-2 h-2 rounded-full bg-white opacity-50"></div>
								</div>
								<div className="pt-8 pb-4 px-2 h-full overflow-y-auto">
									<div className="flex justify-end mb-4">
										<div className="bg-blue-100 text-blue-800 rounded-tl-xl rounded-tr-xl rounded-bl-xl p-3 max-w-[80%]">
											Uber R$20
										</div>
									</div>
									<div className="flex justify-start mb-4">
										<div className="bg-green-100 text-green-800 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 max-w-[80%]">
											<p className="font-semibold mb-1">Gasto adicionado</p>
											<p>📌UBER (transporte)</p>
											<p>R$ 20,00</p>
											<p className="text-xs text-green-600">03/03/2023</p>
										</div>
									</div>
									<div className="flex justify-start mb-4">
										<div className="bg-yellow-100 text-yellow-800 rounded-tr-xl rounded-br-xl rounded-bl-xl p-3 max-w-[80%]">
											<p>Lembrete: Você está quase chegando no seu limite definido de R$30 por mês com Transporte.</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<section
				id="como-funciona"
				className="py-16 bg-white">
				<div className="container mx-auto px-4">
					<h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="card text-center">
							<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-2xl">
								1
							</div>
							<h3 className="text-xl font-semibold mb-3">Registre Despesas</h3>
							<p className="text-gray-600">
								Apenas envie mensagens com seus gastos como "Uber R$20" e o EconomiZap registra automaticamente.
							</p>
						</div>

						<div className="card text-center">
							<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-2xl">
								2
							</div>
							<h3 className="text-xl font-semibold mb-3">Visualize Relatórios</h3>
							<p className="text-gray-600">
								Peça relatórios e análises sobre seus gastos e receba gráficos detalhados.
							</p>
						</div>

						<div className="card text-center">
							<div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-2xl">
								3
							</div>
							<h3 className="text-xl font-semibold mb-3">Alcance Objetivos</h3>
							<p className="text-gray-600">
								Defina metas de economia e limites de gastos para uma vida financeira mais saudável.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section className="py-16 bg-gray-50">
				<div className="container mx-auto px-4">
					<h2 className="text-3xl font-bold text-center mb-12">Planos</h2>

					<div className="max-w-3xl mx-auto">
						<div className="card border-2 border-blue-500 relative">
							<div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
								Popular
							</div>
							<h3 className="text-2xl font-bold mb-4 text-center">Plano Premium</h3>
							<div className="text-center mb-6">
								<span className="text-4xl font-bold">R$9,90</span>
								<span className="text-gray-600">/mês</span>
							</div>

							<ul className="space-y-3 mb-8">
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									<span>Acesso ilimitado a todas as funcionalidades</span>
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									<span>Integração com WhatsApp</span>
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									<span>Categorização automática de despesas</span>
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									<span>Gráficos e relatórios</span>
								</li>
								<li className="flex items-center">
									<span className="text-green-500 mr-2">✓</span>
									<span>Sugestões personalizadas</span>
								</li>
							</ul>

							<div className="text-center">
								<Link
									href="/register"
									className="btn btn-primary inline-block w-full">
									Começar Agora
								</Link>
								<p className="text-sm text-gray-500 mt-3">7 dias de teste grátis, cancele a qualquer momento</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-gray-800 text-white py-8">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<div className="mb-4 md:mb-0">
							<h2 className="text-2xl font-bold">EconomiZap</h2>
							<p className="text-gray-400">Seu assistente financeiro no WhatsApp</p>
						</div>

						<div className="flex space-x-4">
							<Link
								href="/terms"
								className="hover:text-blue-300">
								Termos de Uso
							</Link>
							<Link
								href="/privacy"
								className="hover:text-blue-300">
								Privacidade
							</Link>
							<Link
								href="/contact"
								className="hover:text-blue-300">
								Contato
							</Link>
						</div>
					</div>

					<div className="mt-8 text-center text-gray-400 text-sm">
						&copy; {new Date().getFullYear()} EconomiZap. Todos os direitos reservados.
					</div>
				</div>
			</footer>
		</main>
	);
}
