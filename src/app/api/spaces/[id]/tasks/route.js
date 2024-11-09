import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import Space from '@/models/Space';
import Task from '@/models/Task';
import User from '@/models/User';

export async function POST(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await Space.findOne({ id: params.id });
    if (!space || space.author !== session.user.sid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, assignedTo, deadline, points } = await req.json();
    
    const task = await Task.create({
      spaceId: params.id,
      title,
      description,
      assignedTo,
      deadline,
      points,
      status: 'pending'
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await Space.findOne({ id: params.id });
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const isLeader = space.author === session.user.sid;
    const query = isLeader 
      ? { spaceId: params.id }
      : { 
          spaceId: params.id, 
          assignedTo: { $in: [session.user.sid] } // Changed this line
        };

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await Space.findOne({ id: params.id });
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const task = await Task.findById(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { status } = await req.json();
    const isLeader = space.author === session.user.sid;

    // Validate status update
    if (status === 'completed' && !task.assignedTo.includes(session.user.sid)) {
      return NextResponse.json(
        { error: 'You are not assigned to this task' }, 
        { status: 401 }
      );
    }

    if (status === 'verified' && !isLeader) {
      return NextResponse.json(
        { error: 'Only leader can verify tasks' }, 
        { status: 401 }
      );
    }

    // Update task status
    const updatedTask = await Task.findByIdAndUpdate(
      params.taskId,
      {
        status,
        ...(status === 'completed' && { completedAt: new Date() }),
        ...(status === 'verified' && { verifiedAt: new Date() })
      },
      { new: true }
    );

    // If task is verified, update points
    if (status === 'verified') {
      // Update space members' points
      await Space.updateMany(
        { 
          id: params.id,
          'members.userId': { $in: task.assignedTo }
        },
        { 
          $inc: { 'members.$.points': task.points }
        }
      );

      // Update user points
      await User.updateMany(
        { 
          auth0Id: { $in: task.assignedTo },
          'spaces.spaceId': params.id
        },
        {
          $inc: { 'spaces.$.points': task.points }
        }
      );
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error.message }, 
      { status: 500 }
    );
  }
}