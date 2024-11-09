import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { JoinWorkspaceModal } from './JoinWorkSpaceModal'
import { useRouter } from 'next/navigation'

export function JoinWorkspaceButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = (workspace) => {
    // Redirect to the workspace page using the workspace id
    router.push(`/workspace/${workspace.id}`)
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Join Workspace
      </Button>
      <JoinWorkspaceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}