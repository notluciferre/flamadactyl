import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if it's email confirmation error
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { success: false, message: 'Please verify your email before logging in. Check your inbox for verification link.' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    // Check if email is confirmed
    if (!data.user?.email_confirmed_at) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email before logging in. Check your inbox for verification link.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      token: data.session?.access_token,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
