import { getSession } from '@auth0/nextjs-auth0';
import connectToDatabase from '@/lib/mongodb';
import Space from '@/models/Space';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { generate } from 'generate-password';
export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, width, height } = await req.json();
    const author = session.user.sid;
  const accessCode = generate({length:10,numbers:true})
    const space = await Space.create({
      id: uuidv4(),
      name,
      width,
      height,
      thumbnail: null,
      author,
      accessCode
    });

    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    console.error('Workspace creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create workspace',
      details: error.message 
    }, { status: 500 });
  }
}
