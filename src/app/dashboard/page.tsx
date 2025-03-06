// This is a mock dashboard for demonstration purposes
// In a real implementation, this would fetch data from the API

export const metadata = {
	title: 'EconomiZap - Dashboard',
	description: 'Gerencie suas finanças pessoais com o EconomiZap',
};

import DashboardClient from '@/components/DashboardClient';

export default function DashboardPage() {
	return <DashboardClient />;
}
