// app/api/cron/check-subscriptions/route.ts
import { NextResponse } from 'next/server';
import { checkAndUpdateExpiredSubscriptions } from '@/lib/action/subscription.action';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await checkAndUpdateExpiredSubscriptions();
  
  return NextResponse.json(result);
}