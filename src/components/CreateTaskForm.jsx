"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function CreateTaskForm({ spaceId, members }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: [],
    deadline: new Date(),
    points: 0
  });

  const handleAssigneeChange = (e) => {
    const selectedIds = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({ ...prev, assignedTo: selectedIds }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedTo: formData.assignedTo.map(id => String(id)) // Ensure IDs are strings
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      toast.success('Task created successfully!');
      setIsOpen(false);
      setFormData({
        title: '',
        description: '',
        assignedTo: [],
        deadline: new Date(),
        points: 0
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create New Task</Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="assignedTo">Assign To</Label>
              <select
                id="assignedTo"
                multiple
                value={formData.assignedTo}
                onChange={handleAssigneeChange}
                className="w-full border rounded-md p-2"
              >
                {members.map(member => (
                  <option 
                    key={member.id} 
                    value={member.id}
                  >
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Deadline</Label>
              <Calendar
                mode="single"
                selected={formData.deadline}
                onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                className="rounded-md border"
              />
            </div>

            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}