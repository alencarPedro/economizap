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
		const { subscriptionId } = await req.json();

		if (!subscriptionId) {
			return NextResponse.json({ message: 'ID da assinatura é obrigatório' }, { status: 400 });
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
			.select('id, subscription_id')
			.eq('auth_id', session.user.id)
			.single();

		if (userError) {
			return NextResponse.json({ message: 'Erro ao buscar usuário' }, { status: 500 });
		}

		// Verify the subscription belongs to the user
		if (!user.subscription_id || user.subscription_id !== subscriptionId) {
			return NextResponse.json({ message: 'Assinatura não encontrada ou não pertence ao usuário' }, { status: 403 });
		}

		// Cancel the subscription at period end
		await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: true,
		});

		// Update user subscription status
		await supabase
			.from('users')
			.update({
				subscription_status: 'canceled',
				updated_at: new Date().toISOString(),
			})
			.eq('id', user.id);

		// Log the cancellation in payment_history
		await supabase.from('payment_history').insert({
			user_id: user.id,
			event_type: 'subscription_canceled_by_user',
			subscription_id: subscriptionId,
			status: 'canceled',
			created_at: new Date().toISOString(),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error canceling subscription:', error);
		return NextResponse.json({ message: 'Erro ao cancelar assinatura' }, { status: 500 });
	}
}
