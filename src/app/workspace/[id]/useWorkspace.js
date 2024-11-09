// hooks/useWorkspace.js

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export function useWorkspace(id) {
  const [workspace, setWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    const fetchWorkspace = async () => {
      try {
        setError(null)
        const response = await fetch(`/api/workspace`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to fetch workspace')
        }

        const data = await response.json()
        
        // Validate workspace data
        if (!data?.space?.width || !data?.space?.height) {
          throw new Error('Invalid workspace data received')
        }

        setWorkspace(data)
      } catch (error) {
        console.error('Error fetching workspace:', error)
        setError(error.message)
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspace()
  }, [id])

  return { workspace, isLoading, onlineUsers, error }
}
