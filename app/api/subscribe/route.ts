import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: email.toLowerCase().trim() }]);
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Subscribed!' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
