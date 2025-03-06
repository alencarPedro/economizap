import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
	const [status, setStatus] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function checkStatus() {
			try {
				setLoading(true);
				const response = await fetch('/api/status');
				const data = await response.json();
				setStatus(data);
				setError(null);
			} catch (err) {
				setError('Failed to fetch status');
				console.error(err);
			} finally {
				setLoading(false);
			}
		}

		checkStatus();
		const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="min-h-screen bg-gray-100">
			<Head>
				<title>EconomiZap - Status</title>
				<meta
					name="description"
					content="EconomiZap WhatsApp Bot Status"
				/>
				<link
					rel="icon"
					href="/favicon.ico"
				/>
			</Head>

			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-center mb-8">EconomiZap Status</h1>

				{loading ? (
					<div className="flex justify-center">
						<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
					</div>
				) : error ? (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						<p className="font-bold">Error</p>
						<p>{error}</p>
					</div>
				) : (
					<div className="bg-white shadow-md rounded-lg p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="border rounded-lg p-4">
								<h2 className="text-xl font-semibold mb-4">System Status</h2>
								<div className="flex items-center mb-2">
									<div
										className={`w-3 h-3 rounded-full mr-2 ${
											status?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
										}`}></div>
									<span>Overall Status: {status?.status === 'ok' ? 'Online' : 'Error'}</span>
								</div>
								<div className="flex items-center mb-2">
									<div
										className={`w-3 h-3 rounded-full mr-2 ${
											status?.database === 'connected' ? 'bg-green-500' : 'bg-red-500'
										}`}></div>
									<span>Database: {status?.database || 'Not connected'}</span>
								</div>
								<div className="flex items-center">
									<div
										className={`w-3 h-3 rounded-full mr-2 ${
											status?.openai?.configured ? 'bg-green-500' : 'bg-yellow-500'
										}`}></div>
									<span>OpenAI: {status?.openai?.configured ? 'Configured' : 'Not configured'}</span>
								</div>
								<p className="text-sm text-gray-500 mt-4">
									Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Unknown'}
								</p>
							</div>

							<div className="border rounded-lg p-4">
								<h2 className="text-xl font-semibold mb-4">Statistics</h2>
								<p className="mb-2">
									<span className="font-medium">Users:</span> {status?.userCount || 0}
								</p>
								<p className="mb-2">
									<span className="font-medium">Assistant ID:</span> {status?.openai?.assistantId || 'Not configured'}
								</p>
							</div>
						</div>

						<div className="mt-6 border rounded-lg p-4">
							<h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
							<div className="space-y-2">
								<div className="p-2 bg-gray-100 rounded">
									<p className="font-mono text-sm">/api/status - GET - Check system status</p>
								</div>
								<div className="p-2 bg-gray-100 rounded">
									<p className="font-mono text-sm">/api/webhook - POST - Webhook for external integrations</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</main>

			<footer className="container mx-auto px-4 py-6 text-center text-gray-500">
				<p>EconomiZap - WhatsApp Financial Assistant</p>
			</footer>
		</div>
	);
}
