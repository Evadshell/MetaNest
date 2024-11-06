// pages/api/workspace/furniture.js
import { getSession } from '@auth0/nextjs-auth0'
import connectToDatabase from '@/lib/mongodb'
import SpaceElements from '@/models/SpaceElements'
import { v4 as uuidv4 } from 'uuid'

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getSession(req, res)
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await connectToDatabase()

    if (req.method === 'POST') {
      const { spaceId, elementId, x, y } = req.body

      const element = await SpaceElements.create({
        id: uuidv4(),
        elementId,
        spaceId,
        x,
        y
      })

      return res.status(201).json(element)
    }

    if (req.method === 'GET') {
      const { spaceId } = req.query
      const elements = await SpaceElements.find({ spaceId })
      return res.status(200).json(elements)
    }
  } catch (error) {
    console.error('Furniture placement error:', error)
    return res.status(500).json({ error: 'Failed to manage furniture' })
  }
}