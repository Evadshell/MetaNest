// app/api/workspace/[id]/route.js
import connectToDatabase from "@/lib/mongodb";
import Space from "@/models/Space";
import SpaceElements from "@/models/SpaceElements";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { id } = await req.json();
    await connectToDatabase();

    const space = await Space.findOne({ id });
    if (!space) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Fetch the elements associated with this workspace
    const elements = await SpaceElements.find({ spaceId: id });

    return NextResponse.json({ space, elements }, { status: 200 });
  } catch (error) {
    console.error("Workspace fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    await connectToDatabase();

    const workspaces = await Space.find({});
    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}
