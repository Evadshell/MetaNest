import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import Space from '@/models/Space';
import Task from '@/models/Task';
import User from '@/models/User';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { WorkspaceClient } from './WorkspaceClient';
import OfficeGame from '@/components/MultiPlayer';
export default async function WorkspacePage({ params }) {
  const workspaceId = params?.id;
  
  if (!workspaceId) {
    return redirect('/');
  }

  try {
    const session = await getSession();
    if (!session?.user) {
      return redirect('/api/auth/login');
    }

    const space = await Space.findOne({ id: workspaceId }).lean();
    
    if (!space) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Workspace not found</h1>
          <p className="mt-2 text-gray-600">This workspace does not exist.</p>
        </div>
      );
    }

    const user = await User.findOne({ auth0Id: session.user.sid }).lean();
    const isLeader = space.author === session.user.sid;

    const tasks = await Task.find({
      spaceId: workspaceId,
      ...(isLeader ? {} : { assignedTo: session.user.sid })
    })
    .sort({ createdAt: -1 })
    .lean();

    const safeSpace = {
      ...space,
      members: space.members?.map(member => ({
        id: member.userId?.toString(),
        name: member.name,
        email: member.email,
      })) || [],
      _id: space._id?.toString()
    };

    const safeTasks = tasks.map(task => ({
      ...task,
      _id: task._id?.toString(),
      assignedTo: task.assignedTo?.toString(),
      createdBy: task.createdBy?.toString(),
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString()
    }));

    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-1/4 p-6 bg-white shadow-lg overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">{safeSpace.name}</h1>
            <p className="text-sm text-gray-500">ID: {safeSpace.id}</p>
            <p className="text-sm text-gray-500">Access Code: {safeSpace.accessCode}</p>
          </div>
          
          {isLeader && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New Task</h2>
              <CreateTaskForm 
                spaceId={workspaceId} 
                members={safeSpace.members} 
              />
            </div>
          )}

          <WorkspaceClient
            initialTasks={safeTasks}
            isLeader={isLeader}
            spaceId={workspaceId}
            members={safeSpace.members}
          />
        </div>
        <div className="w-3/4 bg-gray-200 p-6">
          <div className="h-full bg-white rounded-lg shadow-lg flex items-center justify-center">
          <OfficeGame />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading workspace:', error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Error loading workspace</h1>
        <p className="mt-2 text-gray-600">
          An error occurred while loading the workspace. Please try again later.
        </p>
      </div>
    );
  }
}