// app/api/spaces/join/route.js
import { getSession } from '@auth0/nextjs-auth0';
import connectToDatabase from '@/lib/mongodb';
import Space from '@/models/Space';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await connectToDatabase();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId, accessCode } = await req.json();
console.log(spaceId,accessCode)
    // Find space by both ID and access code
    const space = await Space.findOne({
      id: spaceId,
      accessCode: accessCode
    });

    if (!space) {
      return NextResponse.json({ 
        error: 'Invalid workspace ID or access code' 
      }, { status: 404 });
    }

    // Check if user is already a member
    if (space.members.some(member => member.userId === session.user.sid)) {
      return NextResponse.json(space);
    }

    // Add user to members
    space.members.push({
      userId: session.user.sid,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture
    });

    await space.save();
    return NextResponse.json(space);
  } catch (error) {
    console.error('Join workspace error:', error);
    return NextResponse.json({ 
      error: 'Failed to join workspace' 
    }, { status: 500 });
  }
}