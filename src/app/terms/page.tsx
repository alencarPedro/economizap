import Link from 'next/link';

export default function TermsOfService() {
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
				<div className="max-w-3xl mx-auto">
					<h1 className="text-3xl font-bold mb-6">Termos de Serviço</h1>

					<div className="bg-white rounded-lg shadow-md p-6 mb-8">
						<h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
						<p className="mb-4">
							Ao acessar e usar o EconomiZap, você concorda em cumprir e estar vinculado por estes Termos de Serviço. Se
							você não concordar com algum aspecto destes termos, você não deve usar nosso serviço.
						</p>

						<h2 className="text-xl font-semibold mb-4">2. Descrição do Serviço</h2>
						<p className="mb-4">
							O EconomiZap é um assistente financeiro que opera através do WhatsApp, ajudando usuários a rastrear
							despesas, criar orçamentos, estabelecer metas e gerenciar suas finanças pessoais.
						</p>

						<h2 className="text-xl font-semibold mb-4">3. Contas e Registro</h2>
						<p className="mb-4">
							Para usar o EconomiZap, você precisa fornecer um número de telefone válido associado a uma conta do
							WhatsApp. Você é responsável por manter a confidencialidade de sua conta e todas as atividades que ocorrem
							nela.
						</p>

						<h2 className="text-xl font-semibold mb-4">4. Privacidade e Dados</h2>
						<p className="mb-4">
							Ao usar o EconomiZap, você nos autoriza a coletar e processar dados sobre suas finanças para fornecer
							nosso serviço. Consultenos nossa{' '}
							<Link
								href="/privacy"
								className="text-blue-600 hover:underline">
								Política de Privacidade
							</Link>{' '}
							para entender como tratamos suas informações.
						</p>

						<h2 className="text-xl font-semibold mb-4">5. Uso Aceitável</h2>
						<p className="mb-4">
							Você concorda em usar o EconomiZap apenas para fins legais e de acordo com estes Termos. Você não deve
							usar nosso serviço de maneira que possa danificar, desabilitar ou sobrecarregar o EconomiZap.
						</p>

						<h2 className="text-xl font-semibold mb-4">6. Assinaturas e Pagamentos</h2>
						<p className="mb-4">
							O EconomiZap oferece um período de teste gratuito e planos de assinatura pagos. Ao se inscrever em um
							plano pago, você autoriza a cobrança regular da taxa de assinatura no método de pagamento designado.
						</p>

						<h2 className="text-xl font-semibold mb-4">7. Cancelamento e Reembolsos</h2>
						<p className="mb-4">
							Você pode cancelar sua assinatura a qualquer momento. Os reembolsos são processados de acordo com nossa
							política de reembolso atual.
						</p>

						<h2 className="text-xl font-semibold mb-4">8. Modificações ao Serviço e aos Termos</h2>
						<p className="mb-4">
							Reservamos o direito de modificar ou descontinuar o EconomiZap a qualquer momento. Também podemos
							atualizar estes Termos periodicamente, e o uso continuado do serviço após tais alterações constitui sua
							aceitação dos novos Termos.
						</p>

						<h2 className="text-xl font-semibold mb-4">9. Limitação de Responsabilidade</h2>
						<p className="mb-4">
							O EconomiZap é fornecido "como está" e "conforme disponível" sem garantias de qualquer tipo. Não somos
							responsáveis por quaisquer danos indiretos, incidentais, especiais ou consequentes decorrentes do uso de
							nosso serviço.
						</p>

						<h2 className="text-xl font-semibold mb-4">10. Contato</h2>
						<p className="mb-4">
							Se você tiver dúvidas sobre estes Termos, entre em contato conosco pelo e-mail: contato@economizap.com.br
						</p>
					</div>

					<p className="text-center">
						<Link
							href="/"
							className="text-blue-600 hover:underline">
							Voltar para a página inicial
						</Link>
					</p>
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
