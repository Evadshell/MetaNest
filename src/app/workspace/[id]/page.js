'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Users, Settings2, LogOut } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Fix the import path and casing
const PhaserWorkspace = dynamic(() => import('../../../components/PhaserWorkSpace'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-sm text-muted-foreground">Loading game environment...</p>
      </div>
    </div>
  ),
})

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState(1)
  const [error, setError] = useState(null)
  
  const { id } = useParams()
  const { user, isLoading: userLoading } = useUser()

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
          body: JSON.stringify({
            id: id,
          }),
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

  // Handle loading state
  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Handle no workspace data
  if (!workspace?.space) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/50 backdrop-blur-sm dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">{workspace.space.name}</h1>
              <span className="ml-4 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                {workspace.space.width}x{workspace.space.height} Grid
              </span>
              <div className="ml-4 flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                {onlineUsers} online
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    Workspace Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Invite Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/dashboard">
                  <LogOut className="h-4 w-4" />
                  Exit Workspace
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border">
    <div className="p-4">
      {workspace.space && (
        <PhaserWorkspace 
          workspaceData={workspace.space}
          onError={(error) => {
            console.error('Phaser error:', error)
            toast.error('Error loading game environment')
          }}
        />
      )}
    </div>
  </div>
</main>
    </div>
  )
}