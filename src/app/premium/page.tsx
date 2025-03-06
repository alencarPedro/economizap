import PremiumSubscription from '@/components/PremiumSubscription';

export const metadata = {
	title: 'EconomiZap - Planos Premium',
	description:
		'Atualize para o plano Premium do EconomiZap e desfrute de recursos exclusivos para gerenciar melhor suas finanças.',
};

export default function PremiumPage() {
	return (
		<main className="min-h-screen bg-gray-50 py-12">
			<div className="container mx-auto px-4">
				<h1 className="text-4xl font-bold text-center mb-6">Planos EconomiZap</h1>
				<p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
					Escolha o plano perfeito para suas necessidades financeiras. Atualize agora e desbloqueie recursos exclusivos
					para gerenciar melhor seu dinheiro.
				</p>

				<PremiumSubscription />

				<div className="mt-16 max-w-4xl mx-auto">
					<h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>

					<div className="bg-white rounded-lg shadow-md divide-y">
						<div className="p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Posso cancelar minha assinatura a qualquer momento?
							</h3>
							<p className="text-gray-600">
								Sim, você pode cancelar sua assinatura a qualquer momento. Você terá acesso aos recursos premium até o
								final do seu período de cobrança atual.
							</p>
						</div>

						<div className="p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-2">Como funciona o sistema de pagamento?</h3>
							<p className="text-gray-600">
								Utilizamos o Stripe, uma plataforma de pagamento segura e confiável. Seus dados de pagamento são
								criptografados e nunca armazenamos informações sensíveis do seu cartão.
							</p>
						</div>

						<div className="p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-2">Existe algum período de teste gratuito?</h3>
							<p className="text-gray-600">
								Atualmente não oferecemos um período de teste gratuito para os planos premium, mas você pode usar a
								versão básica gratuitamente para conhecer a plataforma.
							</p>
						</div>

						<div className="p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-2">O que acontece se eu mudar de plano?</h3>
							<p className="text-gray-600">
								Ao mudar de plano, você será cobrado proporcionalmente pelo tempo restante do seu período de cobrança
								atual. As novas funcionalidades estarão disponíveis imediatamente após a mudança.
							</p>
						</div>

						<div className="p-6">
							<h3 className="text-lg font-medium text-gray-900 mb-2">Como recebo suporte?</h3>
							<p className="text-gray-600">
								Você pode entrar em contato com nossa equipe de suporte através do email suporte@economizap.com.br ou
								pelo WhatsApp. Os assinantes premium têm acesso a suporte prioritário.
							</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
