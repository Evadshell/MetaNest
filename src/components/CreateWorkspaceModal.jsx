"use client";
// components/CreateWorkspaceModal.jsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const GRID_SIZES = [
  { label: '5x5', width: 5, height: 5 },
  { label: '8x8', width: 8, height: 8 },
  { label: '10x10', width: 10, height: 10 },
]

export function CreateWorkspaceModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false)
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    size: '5x5',
    width: 5,
    height: 5,
  })

  const handleSizeChange = (value) => {
    const size = GRID_SIZES.find(s => s.label === value)
    setWorkspaceData(prev => ({
      ...prev,
      size: value,
      width: size.width,
      height: size.height
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/createWorkspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceData),
      })

      if (!response.ok) throw new Error('Failed to create workspace')

      const data = await response.json()
      toast.success('Workspace created successfully!')
      onSuccess(data)
      onClose()
    } catch (error) {
      console.error('Error creating workspace:', error)
      toast.error('Failed to create workspace')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              value={workspaceData.name}
              onChange={(e) => setWorkspaceData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter workspace name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Grid Size</Label>
            <Select
              value={workspaceData.size}
              onValueChange={handleSizeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {GRID_SIZES.map((size) => (
                  <SelectItem key={size.label} value={size.label}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}