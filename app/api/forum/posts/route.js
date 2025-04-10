import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { models } from "@/models/User";
import mongoose from "mongoose";

// GET all posts with pagination and filtering
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const flair = searchParams.get("flair");
    const sort = searchParams.get("sort") || "newest"; // newest, oldest, most-upvoted

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (flair && flair !== "all") {
      query.flair = flair;
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "most-upvoted":
        sortOptions = { "upvotes.length": -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute query with pagination
    const posts = await models.Post.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate("author", "username")
      .lean();

    // Get total count for pagination
    const total = await models.Post.countDocuments(query);

    return NextResponse.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new post
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, content, flair } = data;

    // Find the user
    const user = await models.User.findOne({ mailId: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create the post
    const post = new models.Post({
      title,
      content,
      author: user._id,
      flair,
      upvotes: [],
      downvotes: [],
      comments: [],
    });

    await post.save();

    // Add post to user's posts
    user.posts = user.posts || [];
    user.posts.push(post._id);
    await user.save();

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
