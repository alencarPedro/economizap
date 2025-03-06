import React from 'react';

interface SavingsGoalCardProps {
	name: string;
	currentAmount: number;
	targetAmount: number;
	targetDate?: string;
}

export default function SavingsGoalCard({ name, currentAmount, targetAmount, targetDate }: SavingsGoalCardProps) {
	const percentage = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);

	return (
		<div className="mb-6">
			<div className="flex justify-between mb-2">
				<p className="font-medium">{name}</p>
				<p className="text-sm font-medium">
					R$ {currentAmount.toFixed(2).replace('.', ',')} / R$ {targetAmount.toFixed(2).replace('.', ',')}
				</p>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2.5">
				<div
					className="bg-blue-600 h-2.5 rounded-full"
					style={{ width: `${percentage}%` }}></div>
			</div>
			<div className="flex justify-between mt-1">
				<p className="text-xs text-gray-500">{percentage}% completado</p>
				{targetDate && <p className="text-xs text-gray-500">Até {targetDate}</p>}
			</div>
		</div>
	);
}
