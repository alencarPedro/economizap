import Link from 'next/link';

export default function PrivacyPolicy() {
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
					<h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>

					<div className="bg-white rounded-lg shadow-md p-6 mb-8">
						<h2 className="text-xl font-semibold mb-4">1. Informações que Coletamos</h2>
						<p className="mb-4">Para fornecer nossos serviços, coletamos as seguintes informações:</p>
						<ul className="list-disc pl-6 mb-4 space-y-2">
							<li>Número de telefone associado à sua conta do WhatsApp</li>
							<li>Endereço de e-mail (opcional)</li>
							<li>Informações sobre suas despesas, receitas e metas financeiras</li>
							<li>Dados de uso e interação com nosso serviço</li>
						</ul>

						<h2 className="text-xl font-semibold mb-4">2. Como Usamos Suas Informações</h2>
						<p className="mb-4">Utilizamos suas informações para:</p>
						<ul className="list-disc pl-6 mb-4 space-y-2">
							<li>Fornecer e personalizar nossos serviços</li>
							<li>Processar e categorizar suas despesas</li>
							<li>Gerar relatórios e análises financeiras</li>
							<li>Enviar lembretes e notificações</li>
							<li>Melhorar nosso serviço e desenvolver novos recursos</li>
						</ul>

						<h2 className="text-xl font-semibold mb-4">3. Compartilhamento de Dados</h2>
						<p className="mb-4">Não vendemos suas informações pessoais a terceiros. Podemos compartilhar dados com:</p>
						<ul className="list-disc pl-6 mb-4 space-y-2">
							<li>Provedores de serviços que nos ajudam a operar o EconomiZap</li>
							<li>Parceiros de processamento de pagamento para cobranças de assinatura</li>
							<li>Autoridades quando exigido por lei</li>
						</ul>

						<h2 className="text-xl font-semibold mb-4">4. Segurança de Dados</h2>
						<p className="mb-4">
							Implementamos medidas técnicas e organizacionais para proteger suas informações contra acesso não
							autorizado, alteração, divulgação ou destruição. Seus dados financeiros são criptografados e armazenados
							com segurança.
						</p>

						<h2 className="text-xl font-semibold mb-4">5. Seus Direitos</h2>
						<p className="mb-4">Você tem o direito de:</p>
						<ul className="list-disc pl-6 mb-4 space-y-2">
							<li>Acessar os dados que temos sobre você</li>
							<li>Corrigir informações imprecisas</li>
							<li>Excluir seus dados (sujeito a certas exceções)</li>
							<li>Restringir ou opor-se ao processamento de seus dados</li>
							<li>Solicitar a portabilidade de seus dados</li>
						</ul>

						<h2 className="text-xl font-semibold mb-4">6. Retenção de Dados</h2>
						<p className="mb-4">
							Mantemos seus dados pelo tempo necessário para fornecer nossos serviços ou conforme exigido por lei.
							Quando você exclui sua conta, seus dados pessoais são removidos de nossos sistemas ativos, mas podem
							permanecer em backups por um período limitado.
						</p>

						<h2 className="text-xl font-semibold mb-4">7. Alterações nesta Política</h2>
						<p className="mb-4">
							Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações
							significativas através do WhatsApp ou e-mail.
						</p>

						<h2 className="text-xl font-semibold mb-4">8. Contato</h2>
						<p className="mb-4">
							Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pelo e-mail:
							privacidade@economizap.com.br
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
