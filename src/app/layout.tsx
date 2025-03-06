import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'EconomiZap - Assistente Financeiro',
	description: 'Assistente financeiro inteligente que opera através do WhatsApp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR">
			<body className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">{children}</body>
		</html>
	);
}
