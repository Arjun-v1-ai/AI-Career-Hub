import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { models } from "@/models/User";
import mongoose from "mongoose";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const data = await request.json();
    const { voteType } = data; // 'upvote' or 'downvote'

    // Validate ID
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

    const userId = user._id.toString();

    // Handle upvote
    if (voteType === "upvote") {
      // Check if user already upvoted
      const alreadyUpvoted = post.upvotes.some(
        (id) => id.toString() === userId
      );

      if (alreadyUpvoted) {
        // Remove upvote
        post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);
        user.upvotedPosts = user.upvotedPosts.filter(
          (postId) => postId.toString() !== id
        );
      } else {
        // Add upvote and remove downvote if exists
        post.upvotes.push(user._id);
        post.downvotes = post.downvotes.filter(
          (id) => id.toString() !== userId
        );

        // Update user's voted posts
        if (!user.upvotedPosts) user.upvotedPosts = [];
        if (!user.downvotedPosts) user.downvotedPosts = [];

        user.upvotedPosts.push(post._id);
        user.downvotedPosts = user.downvotedPosts.filter(
          (postId) => postId.toString() !== id
        );
      }
    }

    // Handle downvote
    if (voteType === "downvote") {
      // Check if user already downvoted
      const alreadyDownvoted = post.downvotes.some(
        (id) => id.toString() === userId
      );

      if (alreadyDownvoted) {
        // Remove downvote
        post.downvotes = post.downvotes.filter(
          (id) => id.toString() !== userId
        );
        user.downvotedPosts = user.downvotedPosts.filter(
          (postId) => postId.toString() !== id
        );
      } else {
        // Add downvote and remove upvote if exists
        post.downvotes.push(user._id);
        post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);

        // Update user's voted posts
        if (!user.upvotedPosts) user.upvotedPosts = [];
        if (!user.downvotedPosts) user.downvotedPosts = [];

        user.downvotedPosts.push(post._id);
        user.upvotedPosts = user.upvotedPosts.filter(
          (postId) => postId.toString() !== id
        );
      }
    }

    await post.save();
    await user.save();

    return NextResponse.json({
      upvotes: post.upvotes.length,
      downvotes: post.downvotes.length,
      userVote: post.upvotes.some((id) => id.toString() === userId)
        ? "upvote"
        : post.downvotes.some((id) => id.toString() === userId)
        ? "downvote"
        : null,
    });
  } catch (error) {
    console.error("Error voting on post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
