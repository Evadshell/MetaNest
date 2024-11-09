import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, Clock, Award } from 'lucide-react';

export function TaskList({ tasks, isLeader, onStatusChange, onVerify }) {
  const [filter, setFilter] = useState('all');

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredTasks = tasks.filter(task => 
    filter === 'all' ? true : task.status === filter
  );

  const getDueStatus = (deadline) => {
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'text-red-500', text: 'Overdue' };
    if (diffDays === 0) return { color: 'text-orange-500', text: 'Due Today' };
    if (diffDays <= 2) return { color: 'text-yellow-500', text: `Due in ${diffDays} days` };
    return { color: 'text-green-500', text: `Due in ${diffDays} days` };
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 pb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'in-progress' ? 'default' : 'outline'}
          onClick={() => setFilter('in-progress')}
        >
          In Progress
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Completed
        </Button>
        <Button
          variant={filter === 'verified' ? 'default' : 'outline'}
          onClick={() => setFilter('verified')}
        >
          Verified
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredTasks.map(task => {
          const dueStatus = getDueStatus(task.deadline);
          
          return (
            <Card key={task._id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Award className="h-4 w-4" />
                      <span className="text-sm text-gray-600">
                        Points: {task.points}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <p className="text-gray-600 mb-4">{task.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      <span className={`text-sm ${dueStatus.color}`}>
                        {dueStatus.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-gray-600">
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isLeader && task.status === 'pending' && (
                      <Button 
                        variant="outline"
                        onClick={() => onStatusChange(task._id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {isLeader && task.status === 'completed' && (
                      <Button
                        variant="default"
                        onClick={() => onVerify(task._id)}
                      >
                        Verify Task
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No tasks found matching the selected filter.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}