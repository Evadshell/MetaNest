// app/api/workspace/create/route.js
import { getSession } from '@auth0/nextjs-auth0';
import connectToDatabase from '@/lib/mongodb';
import Space from '@/models/Space';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Connect to the database first
    await connectToDatabase();

    // Get the session only once
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const { name, width, height } = await req.json();
    const author = session.user.sid;  // fixed spelling of "author"

    // Log the data before creation
    console.log('Creating space with data:', {
      id: uuidv4(),
      name,
      width,
      height,
      author
    });

    // Create a new workspace
    const space = await Space.create({
      id: uuidv4(),
      name,
      width,
      height,
      thumbnail: null,
      author:author  // fixed spelling
    });

    console.log('Created space:', space);  // Add this to debug

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error('Workspace creation error:', error);
    // Log more detailed error information
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    return NextResponse.json({ 
      error: 'Failed to create workspace',
      details: error.message 
    }, { status: 500 });
  }
}