// app/api/workspace/[id]/route.js
import connectToDatabase from "@/lib/mongodb";
import Space from "@/models/Space";
import SpaceElements from "@/models/SpaceElements";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req) {
  try {
    //     const { id } = req.nextUrl.pathname.split('/').pop() // Extract ID from URL
    // const hehe= req.body;
    // console.log(id);
    // console.log(hehe);
    const { id } = await req.json();
    // Connect to the database
    await connectToDatabase();

    // Fetch the workspace by ID
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
