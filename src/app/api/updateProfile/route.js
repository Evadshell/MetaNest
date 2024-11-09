// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@auth0/nextjs-auth0";

export async function GET(req) {
  try {
    const cookies = req.cookies; // Get cookies from the request
    const session = await getSession({ req });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    let user = await User.findOne({ auth0Id: session.user.sid });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        auth0Id: session.user.sid,
        email: session.user.email,
        name: session.user.name,
        picture: session.user.picture,
        nickname: session.user.nickname,
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const { nickname, avatarId } = await req.json(); // Parse the request body
    const session = await getSession({ req });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id: session.user.sid },
      {
        $set: {
          nickname,
          avatarId,
          name: session.user.name,
          picture: session.user.picture,
          email: session.user.email,
        },
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
