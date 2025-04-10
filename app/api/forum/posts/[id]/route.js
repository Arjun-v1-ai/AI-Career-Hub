import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { models } from "@/models/User";
import mongoose from "mongoose";

// GET a specific post
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Find the post and populate author and comments
    const post = await models.Post.findById(id)
      .populate("author", "username")
      .populate({
        path: "comments",
        populate: [
          {
            path: "author",
            select: "username",
          },
          {
            path: "replies",
            populate: {
              path: "author",
              select: "username",
            },
          },
        ],
      });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get the current user's vote status if they're logged in
    const session = await getServerSession(authOptions);
    let userVote = null;

    if (session) {
      const user = await models.User.findOne({ mailId: session.user.email });

      if (user) {
        if (post.upvotes.some((id) => id.toString() === user._id.toString())) {
          userVote = "upvote";
        } else if (
          post.downvotes.some((id) => id.toString() === user._id.toString())
        ) {
          userVote = "downvote";
        }
      }
    }

    // Add userVote to the post data
    const postWithUserVote = {
      ...post.toObject(),
      userVote,
    };

    return NextResponse.json({ post: postWithUserVote });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a post
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

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

    // Check if user is the author of the post
    if (post.author.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Not authorized to delete this post" },
        { status: 403 }
      );
    }

    // Delete all comments associated with the post
    for (const commentId of post.comments) {
      await models.Comment.findByIdAndDelete(commentId);
    }

    // Remove post from user's posts array
    user.posts = user.posts.filter((postId) => postId.toString() !== id);
    await user.save();

    // Delete the post
    await models.Post.findByIdAndDelete(id);

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
