"use client";
// pages/workspace/[id].js
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'; // <-- Use useParams() here
import { useUser } from '@auth0/nextjs-auth0/client'
// import PhaserWorkspace from '@/components/PhaserWorkspace'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic';
import Link from 'next/link';
const PhaserWorkspace = dynamic(() => import('../../../components/PhaserWorkspace'), {
    ssr: false
  });
  
export default function WorkspacePage() {
  const [mounted, setMounted] = useState(false)
  const [workspace, setWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Only enable the router after the component has mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for mounted state before using useRouter
//   const router = useRouter()
//   const { id } = 'f4322e6e-252c-43df-b4d7-d9e5c126055b'
// const router = useRouter(); // <-- Now using `useRouter` from `next/navigation`
// const { id } = router.query; // Use `router.query.id` to get the dynamic `id`
const { id } = useParams(); // <-- Use useParams() instead of router.query
  console.log(id);
const { user, isLoading: userLoading } = useUser()

  useEffect(() => {
    if (!mounted || !id) return // Don't run this code if not mounted or id is not available

    const fetchWorkspace = async () => {
      try {
        const response = await fetch(`/api/workspace`,{
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
              },
              body:JSON.stringify({
                id:id
              }),
        })
        console.log(response)
        if (!response.ok) throw new Error('Failed to fetch workspace')

        const data = await response.json()
        setWorkspace(data)
      } catch (error) {
        console.error('Error fetching workspace:', error)
        toast.error('Failed to load workspace')
        // router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspace()
  }, [id, mounted])

  if (userLoading || isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!workspace) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{workspace.space.name}</h1>
            <p className="text-muted-foreground">
              {workspace.space.width}x{workspace.space.height} Grid
            </p>
          </div>
          <Button variant="outline" >
            <Link href="/dashboard" >
            
            Exit Workspace
            </Link>
          </Button>
        </div>

        <div className="bg-background p-4 rounded-lg shadow-lg">
          <PhaserWorkspace workspaceData={workspace.space} />
        </div>
      </div>
    </div>
  )
}
