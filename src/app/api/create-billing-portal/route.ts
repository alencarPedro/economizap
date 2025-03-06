import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
	try {
		// Get the user from Supabase session
		const supabase = createRouteHandlerClient({ cookies });
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (!session) {
			return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
		}

		// Get the user profile
		const { data: user, error: userError } = await supabase
			.from('users')
			.select('stripe_customer_id')
			.eq('auth_id', session.user.id)
			.single();

		if (userError) {
			return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
		}

		if (!user.stripe_customer_id) {
			return NextResponse.json({ message: 'Cliente Stripe não encontrado' }, { status: 400 });
		}

		// Create a billing portal session
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: user.stripe_customer_id,
			return_url: `${req.headers.get('origin')}/dashboard`,
		});

		return NextResponse.json({ url: portalSession.url });
	} catch (error) {
		console.error('Error creating billing portal session:', error);
		return NextResponse.json({ message: 'Erro ao criar sessão do portal de pagamento' }, { status: 500 });
	}
}
