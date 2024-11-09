// components/JoinWorkspaceModal.jsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function JoinWorkspaceModal({ isOpen, onClose }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    spaceId: '',
    accessCode: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/joinWorkspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join workspace')
      }

      const workspace = await response.json()
      toast.success('Joined workspace successfully!')
      router.push(`/workspace/${workspace.id}`)
      onClose()
    } catch (error) {
      console.error('Error joining workspace:', error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="spaceId">Workspace ID</Label>
              <Input
                id="spaceId"
                value={formData.spaceId}
                onChange={(e) => setFormData(prev => ({ ...prev, spaceId: e.target.value }))}
                placeholder="Enter workspace ID"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                value={formData.accessCode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  accessCode: e.target.value 
                }))}
                placeholder="Enter access code"
                required
                maxLength={10}
                 disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Workspace'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
