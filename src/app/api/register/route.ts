import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByPhone } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		const { phone, email } = await request.json();

		if (!phone) {
			return NextResponse.json({ error: 'Número de telefone é obrigatório' }, { status: 400 });
		}

		// Normalize phone number (remove spaces, parentheses, dashes)
		const normalizedPhone = phone.replace(/\D/g, '');

		// Check if user already exists
		const existingUser = await getUserByPhone(normalizedPhone);

		if (existingUser) {
			return NextResponse.json({ error: 'Usuário já registrado com este número' }, { status: 409 });
		}

		// Create user in database
		const newUser = await createUser(normalizedPhone, email);

		if (!newUser) {
			return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
		}

		// In a production app, here we would:
		// 1. Send a welcome message to the user via WhatsApp
		// 2. Maybe create default categories for the user
		// 3. Set up any initial configuration

		return NextResponse.json({ success: true, message: 'Usuário registrado com sucesso' }, { status: 201 });
	} catch (error) {
		console.error('Error registering user:', error);
		return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
	}
}
