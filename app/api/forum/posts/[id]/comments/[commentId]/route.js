import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { models } from "@/models/User";
import mongoose from "mongoose";

// DELETE a comment
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, commentId } = params; // post id and comment id

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
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

    // Find the comment
    const comment = await models.Comment.findById(commentId).populate("author");
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user is authorized to delete (either comment author or post author)
    const isCommentAuthor =
      comment.author._id.toString() === user._id.toString();
    const isPostAuthor = post.author.toString() === user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return NextResponse.json(
        { error: "Not authorized to delete this comment" },
        { status: 403 }
      );
    }

    // If this is a reply to another comment, remove it from the parent's replies array
    const parentComment = await models.Comment.findOne({ replies: commentId });
    if (parentComment) {
      parentComment.replies = parentComment.replies.filter(
        (reply) => reply.toString() !== commentId
      );
      await parentComment.save();
    } else {
      // Remove from post's comments array
      post.comments = post.comments.filter(
        (comment) => comment.toString() !== commentId
      );
      await post.save();
    }

    // Delete any replies to this comment
    if (comment.replies && comment.replies.length > 0) {
      // Recursively delete all replies
      for (const replyId of comment.replies) {
        await models.Comment.findByIdAndDelete(replyId);
      }
    }

    // Delete the comment
    await models.Comment.findByIdAndDelete(commentId);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
