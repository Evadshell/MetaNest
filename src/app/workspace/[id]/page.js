import { getSession } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import Space from '@/models/Space';
import Task from '@/models/Task';
import User from '@/models/User';
import { CreateTaskForm } from '@/components/CreateTaskForm';
import { WorkspaceClient } from './WorkspaceClient';

export default async function WorkspacePage({ params }) {
  // Store params.id in a variable first
  const workspaceId = params?.id;
  
  if (!workspaceId) {
    return redirect('/');
  }

  try {
    const session = await getSession();
    if (!session?.user) {
      return redirect('/api/auth/login');
    }

    // Use lean() to get plain JavaScript objects instead of Mongoose documents
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

    // Use lean() here as well
    const tasks = await Task.find({
      spaceId: workspaceId,
      ...(isLeader ? {} : { assignedTo: session.user.sid })
    })
    .sort({ createdAt: -1 })
    .lean();

    // Create a safe version of the data for serialization
    const safeSpace = {
      ...space,
      members: space.members?.map(member => ({
        id: member.userId?.toString(),
        name: member.name,
        email: member.email,
        // Add other necessary member fields, but keep them simple
      })) || [],
      _id: space._id?.toString()
    };

    const safeTasks = tasks.map(task => ({
      ...task,
      _id: task._id?.toString(),
      // Convert any other ObjectIds to strings
      assignedTo: task.assignedTo?.toString(),
      createdBy: task.createdBy?.toString(),
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString()
    }));

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{safeSpace.name}</h1>
            <p className="text-gray-500">ID: {safeSpace.id}</p>
            <p className="text-gray-500">Access Code: {safeSpace.accessCode}</p>
          </div>
          {isLeader && (
            <CreateTaskForm 
              spaceId={workspaceId} 
              members={safeSpace.members} 
            />
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            {/* Leaderboard component can be added here */}
          </div>
          <div className="col-span-9">
            <WorkspaceClient
              initialTasks={safeTasks}
              isLeader={isLeader}
              spaceId={workspaceId}
              members={safeSpace.members}
            />
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