import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { models } from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const { User } = models;

    const user = await User.findOne({ mailId: email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if career guidance exists
    const hasCareerGuidance = !!user.careerGuidance;

    // Make sure to include careerPathInfo in the response
    return NextResponse.json({
      _id: user._id,
      username: user.username,
      gender: user.gender,
      country: user.country,
      state: user.state,
      domain: user.domain,
      otherDomain: user.otherDomain,
      skills: user.skills || [],
      skillScores: user.skillScores || [],
      hasCareerGuidance: hasCareerGuidance,
      careerPathInfo: user.careerPathInfo || {
        currentLevel: "Entry Level",
        nextSteps: [],
        recommendedRoles: [],
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
