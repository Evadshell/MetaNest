'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from '@/components/TaskList';
import { TaskFilters } from '@/components/TaskFilters';

export function WorkspaceClient({ initialTasks, isLeader, spaceId, members }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(task => 
    (filter === 'all' || task.status === filter) &&
    (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const updatedTask = await response.json();
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? updatedTask : task
        )
      );
      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error(error.message);
    }
  }, [spaceId]);

  return (
    <Tabs defaultValue="tasks" className="w-full">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="tasks" className="flex-1">Tasks</TabsTrigger>
        {isLeader && <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>}
      </TabsList>

      <TabsContent value="tasks">
        <TaskFilters
          onFilterChange={setFilter}
          onSearch={setSearchQuery}
        />
        <TaskList
          tasks={filteredTasks}
          isLeader={isLeader}
          onStatusChange={handleStatusChange}
          onVerify={(taskId) => handleStatusChange(taskId, 'verified')}
        />
      </TabsContent>

      {isLeader && (
        <TabsContent value="analytics">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Analytics Content</h3>
            <p>Add your analytics content here.</p>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}