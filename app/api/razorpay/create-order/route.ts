// app/api/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrderForClerkPlan } from '@/lib/action/subscription.action';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    console.log('=== API Route: Create Order ===');
    
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      console.error('No user ID found');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);
    
    const { planKey } = body;

    if (!planKey) {
      console.error('No plan key provided');
      return NextResponse.json({ success: false, error: 'Plan key required' }, { status: 400 });
    }

    console.log('Calling createRazorpayOrderForClerkPlan with:', planKey);

    const result = await createRazorpayOrderForClerkPlan(planKey);

    console.log('Result from createRazorpayOrderForClerkPlan:', result);

    if (!result.success) {
      console.error('Order creation failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Order creation failed' },
        { status: 400 }
      );
    }

    console.log('✅ Order created successfully:', result.orderId);
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ API Route Error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}