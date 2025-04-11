import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { models } from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { careerPathInfo } = await request.json();

    if (!careerPathInfo) {
      return NextResponse.json(
        { error: "Career path information is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const { User } = models;

    const user = await User.findOne({ mailId: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update the user's career path information
    user.careerPathInfo = careerPathInfo;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving career path info:", error);
    return NextResponse.json(
      { error: "Failed to save career path information" },
      { status: 500 }
    );
  }
}
