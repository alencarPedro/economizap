import React from 'react';

interface ExpenseCardProps {
	category: string;
	description: string;
	amount: number;
	date: string;
	icon?: string;
}

export default function ExpenseCard({ category, description, amount, date, icon = '📌' }: ExpenseCardProps) {
	return (
		<div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
			<div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
				{icon}
			</div>
			<div className="flex-1">
				<p className="font-medium">{description}</p>
				<p className="text-xs text-gray-500">{category}</p>
				<p className="text-xs text-gray-500">{date}</p>
			</div>
			<p className="font-medium">R$ {amount.toFixed(2).replace('.', ',')}</p>
		</div>
	);
}
