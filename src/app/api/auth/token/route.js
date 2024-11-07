// app/api/auth/token/route.js
import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // Create a mock response object since we're in an API route
    const res = new NextResponse();
    
    const { accessToken } = await getAccessToken(req, res, {
      scopes: ['read:users', 'update:users']
    });
    
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get access token' },
      { status: error.status || 500 }
    );
  }
}