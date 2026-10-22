import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Standard organizational directory accounts
const DIRECTORY_ACCOUNTS = [
  { name: 'ForYourGoal Support', email: 'support@foryourgoal.com', role: 'Support Team' },
  { name: 'ForYourGoal Team', email: 'team@foryourgoal.com', role: 'General' },
  { name: 'ForYourGoal Billing', email: 'billing@foryourgoal.com', role: 'Finance' },
  { name: 'ForYourGoal Admin', email: 'admin@foryourgoal.com', role: 'Administration' },
  { name: 'ForYourGoal Info', email: 'info@foryourgoal.com', role: 'Inquiries' },
  { name: 'Imon Khan', email: 'imon@foryourgoal.com', role: 'Engineering' },
  { name: 'Imon Khan', email: 'imon.khan@foryourgoal.com', role: 'Engineering' },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    // Return directory accounts; if user has session, we can include their known addresses
    return NextResponse.json({
      contacts: DIRECTORY_ACCOUNTS,
      currentUser: session ? { email: session.email, name: session.displayName || session.email } : null,
    });
  } catch {
    return NextResponse.json({ contacts: DIRECTORY_ACCOUNTS });
  }
}
