"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/services/routeProtectionService";
import ChatbotController from "@/components/ChatbotController";

export default function CreatePost() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [flair, setFlair] = useState("career-discussion");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const flairs = [
    { value: "career-discussion", label: "Career Discussion" },
    { value: "interview-experience", label: "Interview Experience" },
    { value: "salary-details", label: "Salary Details" },
    { value: "success-story", label: "Success Story" },
    { value: "question", label: "Question" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/forum/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          flair,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create post");
      }

      const data = await response.json();

      // Redirect to the new post
      router.push(`/forum/${data.post._id}`);
    } catch (err) {
      console.error("Error creating post:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0D1117] px-4 flex flex-col">
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-16">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Forum
            </button>

            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E31D65] to-[#FF6B2B]">
              Create a Post
            </h1>
          </div>

          <div className="bg-[#161B22] p-6 rounded-lg shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E31D65] to-[#FF6B2B] opacity-10 rounded-bl-full"></div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg text-white mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="flair" className="block text-gray-400 mb-2">
                  Select a Flair
                </label>
                <select
                  id="flair"
                  value={flair}
                  onChange={(e) => setFlair(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0D1117] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                  required
                >
                  {flairs.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label htmlFor="title" className="block text-gray-400 mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                  className="w-full px-4 py-3 bg-[#0D1117] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                  required
                  maxLength={200}
                />
                <div className="text-right text-gray-500 text-sm mt-1">
                  {title.length}/200
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="content" className="block text-gray-400 mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your experience, question, or advice..."
                  className="w-full px-4 py-3 bg-[#0D1117] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65] min-h-[200px]"
                  required
                  maxLength={10000}
                />
                <div className="text-right text-gray-500 text-sm mt-1">
                  {content.length}/10000
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-[#1F2937] text-white rounded-lg hover:bg-[#2D3748] mr-4"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Posting...
                    </>
                  ) : (
                    "Create Post"
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
        <ChatbotController />
      </div>
    </ProtectedRoute>
  );
}
