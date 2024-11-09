import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function WorkspaceAnalytics({ tasks, members }) {
  const completionRate = tasks.length > 0 
    ? (tasks.filter(t => t.status === 'verified').length / tasks.length * 100).toFixed(1)
    : 0;

  const tasksByMonth = tasks.reduce((acc, task) => {
    const month = new Date(task.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(tasksByMonth).map(([month, count]) => ({
    month,
    tasks: count
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-primary/10 rounded-lg">
            <h3 className="text-sm font-medium">Total Tasks</h3>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <h3 className="text-sm font-medium">Completion Rate</h3>
            <p className="text-2xl font-bold">{completionRate}%</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <h3 className="text-sm font-medium">Active Members</h3>
            <p className="text-2xl font-bold">{members.length}</p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <LineChart data={chartData} width={600} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="tasks" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  );
}
