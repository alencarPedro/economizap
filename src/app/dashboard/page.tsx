// This is a mock dashboard for demonstration purposes
// In a real implementation, this would fetch data from the API

export const metadata = {
	title: 'EconomiZap - Dashboard',
	description: 'Gerencie suas finanças pessoais com o EconomiZap',
};

import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
	return <Dashboard />;
}
