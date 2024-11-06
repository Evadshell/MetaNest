// app/api/workspace/create/route.js
import { getSession } from '@auth0/nextjs-auth0'
import connectToDatabase from '@/lib/mongodb'
import Space from '@/models/Space'
import { v4 as uuidv4 } from 'uuid'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req) {
  try {
    // Get the session and validate
    const session = await getSession({ req })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect to the database
    await connectToDatabase()

    // Parse the request body
    const { name, width, height } = await req.json()

    // Create a new workspace
    const space = await Space.create({
      id: uuidv4(),
      name,
      width,
      height,
      thumbnail: null, // Thumbnail will be added later
    })

    return NextResponse.json(space, { status: 201 })
  } catch (error) {
    console.error('Workspace creation error:', error)
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
  }
}
