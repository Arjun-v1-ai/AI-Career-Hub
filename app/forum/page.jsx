"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { ProtectedRoute } from "@/services/routeProtectionService";
import ChatbotController from "@/components/ChatbotController";

export default function Forum() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFlair, setSelectedFlair] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const flairs = [
    { value: "all", label: "All Posts" },
    { value: "career-discussion", label: "Career Discussion" },
    { value: "interview-experience", label: "Interview Experience" },
    { value: "salary-details", label: "Salary Details" },
    { value: "success-story", label: "Success Story" },
    { value: "question", label: "Question" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "most-upvoted", label: "Most Upvoted" },
  ];

  useEffect(() => {
    fetchPosts();
  }, [currentPage, selectedFlair, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      let url = `/api/forum/posts?page=${currentPage}&limit=10`;
      if (selectedFlair !== "all") {
        url += `&flair=${selectedFlair}`;
      }
      url += `&sort=${sortBy}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, voteType) => {
    try {
      const response = await fetch(`/api/forum/posts/${postId}/vote`, {
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
      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            return {
              ...post,
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              userVote: data.userVote,
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to vote: " + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading") {
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
            Loading forum posts
          </span>
        </h2>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0D1117] px-4 flex flex-col">
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-0 text-transparent bg-clip-text bg-gradient-to-r from-[#E31D65] to-[#FF6B2B]">
              Community Forum
            </h1>
            <button
              onClick={() => router.push("/forum/create")}
              className="px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90 flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </button>
          </div>

          {/* Filters */}
          <div className="bg-[#161B22] p-4 rounded-lg mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-gray-400 mb-2 text-sm">
                  Filter by Flair
                </label>
                <select
                  value={selectedFlair}
                  onChange={(e) => setSelectedFlair(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                >
                  {flairs.map((flair) => (
                    <option key={flair.value} value={flair.value}>
                      {flair.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-gray-400 mb-2 text-sm">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D1117] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchPosts}
                  className="px-4 py-2 bg-[#1F2937] text-white rounded-lg hover:bg-[#2D3748] flex items-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin h-8 w-8 border-2 border-[#E31D65] border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg text-white">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-[#161B22] p-8 rounded-lg text-center">
              <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No posts found
              </h3>
              <p className="text-gray-400 mb-6">
                {selectedFlair !== "all"
                  ? `There are no posts with the "${
                      flairs.find((f) => f.value === selectedFlair)?.label
                    }" flair.`
                  : "Be the first to start a discussion!"}
              </p>
              <button
                onClick={() => router.push("/forum/create")}
                className="px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90"
              >
                Create a Post
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-[#161B22] p-4 rounded-lg shadow-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E31D65] to-[#FF6B2B] opacity-10 rounded-bl-full"></div>

                  <div className="flex items-start">
                    {/* Voting */}
                    <div className="flex flex-col items-center mr-4">
                      <button
                        onClick={() => handleVote(post._id, "upvote")}
                        className={`p-1 rounded-full ${
                          post.userVote === "upvote"
                            ? "text-[#E31D65] bg-[#E31D65]/10"
                            : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
                        }`}
                        aria-label="Upvote"
                      >
                        <ThumbsUp className="h-5 w-5" />
                      </button>
                      <span className="text-white font-medium my-1">
                        {(post.upvotes?.length || 0) -
                          (post.downvotes?.length || 0)}
                      </span>
                      <button
                        onClick={() => handleVote(post._id, "downvote")}
                        className={`p-1 rounded-full ${
                          post.userVote === "downvote"
                            ? "text-[#E31D65] bg-[#E31D65]/10"
                            : "text-gray-400 hover:text-white hover:bg-[#1F2937]"
                        }`}
                        aria-label="Downvote"
                      >
                        <ThumbsDown className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="px-2 py-1 text-xs bg-[#1F2937] text-gray-300 rounded-md mr-2">
                          {flairs.find((f) => f.value === post.flair)?.label ||
                            post.flair}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Posted by {post.author?.username || "Anonymous"} •{" "}
                          {formatDate(post.createdAt)}
                        </span>
                      </div>

                      <Link href={`/forum/${post._id}`}>
                        <h2 className="text-xl font-semibold text-white mb-2 hover:text-[#E31D65] transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      <p className="text-gray-300 mb-4 line-clamp-3">
                        {post.content}
                      </p>

                      <div className="flex items-center">
                        <Link
                          href={`/forum/${post._id}`}
                          className="flex items-center text-gray-400 hover:text-white"
                        >
                          <MessageCircle className="h-5 w-5 mr-1" />
                          <span>{post.comments?.length || 0} comments</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg ${
                        currentPage === 1
                          ? "bg-[#1F2937]/50 text-gray-500 cursor-not-allowed"
                          : "bg-[#1F2937] text-white hover:bg-[#2D3748]"
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="px-4 py-2 bg-[#1F2937] text-white rounded-lg">
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg ${
                        currentPage === totalPages
                          ? "bg-[#1F2937]/50 text-gray-500 cursor-not-allowed"
                          : "bg-[#1F2937] text-white hover:bg-[#2D3748]"
                      }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
        <ChatbotController />
      </div>
    </ProtectedRoute>
  );
}
