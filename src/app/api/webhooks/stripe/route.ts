import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
	apiVersion: '2023-10-16',
});

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Set export config for the API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
	try {
		const body = await req.text();
		const signature = headers().get('stripe-signature') || '';

		// Verify webhook signature
		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
		} catch (err: any) {
			console.error(`Webhook signature verification failed: ${err.message}`);
			return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
		}

		// Handle the event
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSessionCompleted(session);
				break;
			}
			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
				break;
			}
			default:
				console.log(`Unhandled event type ${event.type}`);
		}

		return NextResponse.json({ received: true });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
	try {
		// Get customer details
		const customerId = session.customer as string;
		const customer = await stripe.customers.retrieve(customerId);

		if (!customer || customer.deleted) {
			throw new Error('Customer not found or deleted');
		}

		// Get subscription details
		const subscriptionId = session.subscription as string;
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);

		// Get user from Supabase
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('email', customer.email)
			.single();

		if (userError || !userData) {
			console.error('User not found in database:', userError);
			throw new Error('User not found in database');
		}

		// Update user subscription status
		const { error: updateError } = await supabase
			.from('users')
			.update({
				is_premium: true,
				stripe_customer_id: customerId,
				stripe_subscription_id: subscriptionId,
				subscription_status: subscription.status,
				subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
				subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
			})
			.eq('id', userData.id);

		if (updateError) {
			console.error('Error updating user subscription:', updateError);
			throw new Error('Error updating user subscription');
		}

		console.log(`User ${userData.id} subscription updated successfully`);
	} catch (error) {
		console.error('Error handling checkout session completed:', error);
		throw error;
	}
}
