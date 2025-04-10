"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Send,
  User,
  Clock,
  Trash2,
  Edit,
} from "lucide-react";
import { ProtectedRoute } from "@/services/routeProtectionService";
import ChatbotController from "@/components/ChatbotController";

export default function PostDetail({ params }) {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const flairs = [
    { value: "career-discussion", label: "Career Discussion" },
    { value: "interview-experience", label: "Interview Experience" },
    { value: "salary-details", label: "Salary Details" },
    { value: "success-story", label: "Success Story" },
    { value: "question", label: "Question" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/forum/posts/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch post");
      }

      const data = await response.json();
      console.log("Fetched post data:", data); // Add this for debugging
      setPost(data.post);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      const response = await fetch(`/api/forum/posts/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();

      // Update the post in the state
      setPost({
        ...post,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        userVote: data.userVote,
      });
    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to vote: " + err.message);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      setIsSubmittingComment(true);

      const response = await fetch(`/api/forum/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
      });

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      // Clear the comment input
      setComment("");

      // Refresh the post to show the new comment
      await fetchPost();
    } catch (err) {
      console.error("Error posting comment:", err);
      alert("Failed to post comment: " + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (e, commentId) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      return;
    }

    try {
      setIsSubmittingComment(true);

      const response = await fetch(`/api/forum/posts/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent,
          parentCommentId: commentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post reply");
      }

      // Clear the reply input and reset replyingTo
      setReplyContent("");
      setReplyingTo(null);

      // Refresh the post to show the new reply
      await fetchPost();
    } catch (err) {
      console.error("Error posting reply:", err);
      alert("Failed to post reply: " + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center">
        <div className="w-16 h-16 mb-8">
          <svg
            className="animate-spin h-16 w-16 text-[#E31D65]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          <span className="bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-transparent bg-clip-text">
            Loading post
          </span>
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] px-4 flex flex-col">
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push("/forum")}
              className="flex items-center text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Forum
            </button>
          </div>
          <div className="bg-red-900/30 border border-red-700 p-6 rounded-lg text-white">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={fetchPost}
              className="mt-4 px-4 py-2 bg-[#1F2937] text-white rounded-lg hover:bg-[#2D3748]"
            >
              Try Again
            </button>
          </div>
        </main>
        <ChatbotController />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0D1117] px-4 flex flex-col">
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push("/forum")}
              className="flex items-center text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Forum
            </button>
          </div>
          <div className="bg-[#161B22] p-8 rounded-lg text-center">
            <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Post not found
            </h3>
            <p className="text-gray-400 mb-6">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/forum")}
              className="px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90"
            >
              Return to Forum
            </button>
          </div>
        </main>
        <ChatbotController />
      </div>
    );
  }

  // Check if the current user is the author of the post
  const isAuthor = session?.user?.email === post.author?.email;

  // Function to handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/forum/posts/${id}/comments/${commentId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      // Refresh the post to update the comments
      await fetchPost();
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment: " + err.message);
    }
  };

  // Function to handle post deletion
  const handleDeletePost = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/forum/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Redirect to the forum page after successful deletion
      router.push("/forum");
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post: " + err.message);
    }
  };

  // Recursive function to render comments and their replies
  const renderComments = (comments, parentId = null) => {
    return comments
      .filter((comment) => comment.parentCommentId === parentId)
      .map((comment) => (
        <div
          key={comment._id}
          className={`bg-[#1F2937] p-4 rounded-lg mb-4 ${
            parentId ? "ml-8 border-l-2 border-[#E31D65]/30" : ""
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <div className="bg-[#0D1117] p-2 rounded-full mr-3">
                <User className="h-5 w-5 text-[#E31D65]" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {comment.author?.username || "Anonymous"}
                </p>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Comment actions (delete button) */}
            {(session?.user?.email === comment.author?.email || isAuthor) && (
              <button
                onClick={() => handleDeleteComment(comment._id)}
                className="text-gray-400 hover:text-white p-1"
                aria-label="Delete comment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="text-gray-300 mb-3">{comment.content}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                setReplyingTo(replyingTo === comment._id ? null : comment._id)
              }
              className="text-gray-400 hover:text-white text-sm flex items-center"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Reply
            </button>
          </div>

          {/* Reply form */}
          {replyingTo === comment._id && (
            <form
              onSubmit={(e) => handleSubmitReply(e, comment._id)}
              className="mt-3"
            >
              <div className="flex items-center bg-[#0D1117] rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-grow px-4 py-2 bg-transparent text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !replyContent.trim()}
                  className={`px-4 py-2 ${
                    isSubmittingComment || !replyContent.trim()
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] hover:opacity-90"
                  } text-white`}
                >
                  {isSubmittingComment ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Render replies recursively */}
          {renderComments(post.comments, comment._id)}
        </div>
      ));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0D1117] px-4 flex flex-col">
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.push("/forum")}
              className="flex items-center text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Forum
            </button>
          </div>

          {/* Post Content */}
          <div className="bg-[#161B22] p-6 rounded-lg shadow-md relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E31D65] to-[#FF6B2B] opacity-10 rounded-bl-full"></div>

            <div className="flex items-start">
              {/* Voting */}
              <div className="flex flex-col items-center mr-6">
                <button
                  onClick={() => handleVote("upvote")}
                  className={`p-2 rounded-full ${
                    post.userVote === "upvote"
                      ? "text-[#E31D65] bg-[#E31D65]/10"
                      : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
                  }`}
                  aria-label="Upvote"
                >
                  <ThumbsUp className="h-6 w-6" />
                </button>
                <span className="text-white font-medium my-2 text-lg">
                  {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
                </span>
                <button
                  onClick={() => handleVote("downvote")}
                  className={`p-2 rounded-full ${
                    post.userVote === "downvote"
                      ? "text-[#E31D65] bg-[#E31D65]/10"
                      : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
                  }`}
                  aria-label="Downvote"
                >
                  <ThumbsDown className="h-6 w-6" />
                </button>
              </div>

              {/* Post Content */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 text-sm bg-[#1F2937] text-gray-300 rounded-md">
                    {flairs.find((f) => f.value === post.flair)?.label ||
                      post.flair}
                  </span>
                  <span className="text-gray-400 text-sm">
                    Posted by {post.author?.username || "Anonymous"} •{" "}
                    {formatDate(post.createdAt)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  {post.title}
                </h1>

                <div className="text-gray-300 mb-6 whitespace-pre-wrap">
                  {post.content}
                </div>

                {/* Post actions */}
                {isAuthor && (
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/forum/edit/${id}`}
                      className="px-4 py-2 bg-[#1F2937] text-white rounded-lg hover:bg-[#2D3748] flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Post
                    </Link>
                    <button
                      onClick={handleDeletePost}
                      className="px-4 py-2 bg-red-900/50 text-white rounded-lg hover:bg-red-900/70 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-[#161B22] p-6 rounded-lg shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E31D65] to-[#FF6B2B] opacity-10 rounded-bl-full"></div>

            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Comments ({post.comments?.length || 0})
            </h2>

            {/* Comment form */}
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex flex-col">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-3 bg-[#0D1117] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65] min-h-[100px] mb-3"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !comment.trim()}
                    className={`px-4 py-2 ${
                      isSubmittingComment || !comment.trim()
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] hover:opacity-90"
                    } text-white rounded-lg flex items-center`}
                  >
                    {isSubmittingComment ? (
                      <>
                        <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Comments list */}
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-4">{renderComments(post.comments)}</div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </main>
        <ChatbotController />
      </div>
    </ProtectedRoute>
  );
}
