import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { models } from "@/models/User";
import mongoose from "mongoose";

// POST a new comment
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // post id
    const data = await request.json();
    const { content, parentCommentId } = data;

    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Find the user
    const user = await models.User.findOne({ mailId: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the post
    const post = await models.Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create the comment
    const comment = new models.Comment({
      content,
      author: user._id,
      likes: [],
      replies: [],
    });

    await comment.save();

    // If this is a reply to another comment
    if (parentCommentId) {
      // Validate parent comment ID
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return NextResponse.json(
          { error: "Invalid parent comment ID" },
          { status: 400 }
        );
      }

      // Find the parent comment
      const parentComment = await models.Comment.findById(parentCommentId);
      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Add this comment as a reply to the parent comment
      parentComment.replies.push(comment._id);
      await parentComment.save();
    } else {
      // Add comment to post's comments
      post.comments.push(comment._id);
      await post.save();
    }

    // Populate author details for response
    await comment.populate("author", "username");

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
