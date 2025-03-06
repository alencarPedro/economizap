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
		const { priceId } = await req.json();

		if (!priceId) {
			return NextResponse.json({ message: 'Parâmetro priceId é obrigatório' }, { status: 400 });
		}

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
			.select('*')
			.eq('auth_id', session.user.id)
			.single();

		if (userError) {
			return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
		}

		// Create Stripe customer if it doesn't exist
		let customerId = user.stripe_customer_id;

		if (!customerId) {
			const customer = await stripe.customers.create({
				email: session.user.email || undefined,
				name: user.name || undefined,
				metadata: {
					userId: user.id,
					authId: session.user.id,
				},
			});

			customerId = customer.id;

			// Update user with Stripe customer ID
			await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
		}

		// Create checkout session
		const checkoutSession = await stripe.checkout.sessions.create({
			customer: customerId,
			payment_method_types: ['card'],
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			mode: 'subscription',
			success_url: `${req.headers.get('origin')}/dashboard?payment=success`,
			cancel_url: `${req.headers.get('origin')}/premium?payment=canceled`,
			metadata: {
				userId: user.id,
			},
		});

		return NextResponse.json({ sessionId: checkoutSession.id });
	} catch (error) {
		console.error('Error creating checkout session:', error);
		return NextResponse.json({ message: 'Erro ao criar sessão de checkout' }, { status: 500 });
	}
}
