"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import QuestionService from "@/services/questionService";
import MarkdownIt from "markdown-it";
import { Button } from "@/components/ui/button";
import {
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  StarHalf,
} from "lucide-react";
import { ProtectedRoute } from "@/services/routeProtectionService";
import Loader from "@/components/Loader";

const md = new MarkdownIt();

const ProctoredSkillTest = () => {
  const searchParams = useSearchParams();
  const skill = searchParams.get("skill");

  // Proctoring states
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState(null);
  const [warning, setWarning] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [cheatingDetected, setCheatingDetected] = useState(false);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Quiz states
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  // Feedback states
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackStars, setFeedbackStars] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const fetchedQuestions = await QuestionService.fetchQuestions(skill);
        setQuestions(fetchedQuestions);
      } catch (error) {
        setError(error.message);
        console.error("Failed to load questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (skill) {
      loadQuestions();
    }
  }, [skill]);

  // Proctoring video effect
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Proctoring functions
  const startTest = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setIsTestStarted(true);
      setWarning(null);
      setTestResult(null);

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000);
    } catch (err) {
      setWarning("Please allow camera and microphone access to continue");
      console.error("Media access error:", err);
    }
  };

  const stopTest = async () => {
    if (mediaRecorderRef.current && stream) {
      setIsAnalyzing(true);
      setWarning(null);

      try {
        mediaRecorderRef.current.stop();
        stream.getTracks().forEach((track) => track.stop());

        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = async () => {
            try {
              const recordedBlob = new Blob(chunksRef.current, {
                type: "video/webm",
              });
              const result = await sendToBackend(recordedBlob);
              if (result?.cheated) {
                setCheatingDetected(true);
              }
            } catch (err) {
              console.error("Processing error:", err);
              setWarning(err.message || "Error processing the recording");
            } finally {
              resolve();
            }
          };
        });
      } catch (err) {
        console.error("Stop test error:", err);
        setWarning("Error stopping the test. Please try again.");
      } finally {
        setStream(null);
        chunksRef.current = [];
        setIsTestStarted(false);
        setIsAnalyzing(false);
      }
    }
  };

  const BACKEND_URL =
    process.env.NODE_ENV === "production"
      ? "https://ai-career-hub-2.onrender.com" // Your backend Render URL
      : "http://localhost:3002";

  const checkServerConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const sendToBackend = async (videoBlob) => {
    try {
      const isServerConnected = await checkServerConnection();
      if (!isServerConnected) {
        throw new Error(
          "Cannot connect to the analysis server. Please ensure the server is running."
        );
      }

      const formData = new FormData();
      formData.append("video", videoBlob, "recording.webm");

      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error occurred" }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (!result || typeof result.cheated !== "boolean") {
        throw new Error("Invalid response format from server");
      }

      setTestResult(result);
      return result;
    } catch (error) {
      console.error("Analysis error:", error);
      setWarning(
        error.message || "Error analyzing test recording. Please try again."
      );
      throw error;
    }
  };

  // Quiz functions
  const handleAnswer = (answer) => {
    if (!isTestStarted) {
      setWarning("Please start the proctoring system first");
      return;
    }
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
  };

  const calculateScore = () => {
    let correct = Object.keys(answers).filter(
      (i) => answers[i] === questions[i].correctAnswer
    ).length;
    return (correct / questions.length) * 100;
  };

  const handleNext = async () => {
    if (currentQuestion === questions.length - 1) {
      await stopTest(); // Stop recording when quiz is complete
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      const finalScore = calculateScore();
      setScore(finalScore);
      setIsComplete(true);
      setShowFeedback(true); // Show feedback form after test completion
    }
  };

  const handleRetake = () => {
    submitFeedbackIfNeeded().then(() => {
      setCurrentQuestion(0);
      setAnswers({});
      setScore(null);
      setIsComplete(false);
      setCheatingDetected(false);
      setTestResult(null);
      setShowFeedback(false);
      setFeedbackSubmitted(false);
      startTest(); // Restart proctoring
    });
  };

  const handleBackToProfile = async () => {
    if (cheatingDetected) {
      setWarning("Cannot proceed due to detected violations during the test");
      return;
    }

    await submitFeedbackIfNeeded();

    try {
      const response = await fetch("/api/update-skill-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill: skill,
          score: score,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update skill score");
      }

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error saving test results:", error);
      setWarning("Failed to save test results. Please try again.");
    }
  };

  // Feedback functions
  const handleStarClick = (rating) => {
    setFeedbackStars(rating);
  };

  const submitFeedbackIfNeeded = async () => {
    if (feedbackSubmitted || feedbackStars === 0) return Promise.resolve();

    if (feedbackStars > 0) {
      return submitFeedback();
    }

    return Promise.resolve();
  };

  const submitFeedback = async () => {
    if (feedbackStars === 0) {
      return;
    }

    try {
      setIsSubmittingFeedback(true);

      const response = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: "assessments",
          stars: feedbackStars,
          comment: feedbackComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setWarning("Failed to submit feedback. Will try again.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Loading state
  if (loading) {
    return <Loader message={`Preparing your ${skill} assessment`} />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-[#161B22] rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <button
            onClick={handleBackToProfile}
            className="px-4 py-2 bg-[#30363D] text-white rounded-lg hover:opacity-90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-[#161B22] rounded-lg shadow-lg p-6 text-center">
          <div className="text-white text-xl mb-4">
            No questions available for {skill}
          </div>
          <button
            onClick={handleBackToProfile}
            className="px-4 py-2 bg-[#30363D] text-white rounded-lg hover:opacity-90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Feedback component
  const FeedbackForm = () => {
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const handleInputChange = () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setFeedbackComment(inputRef.current.value);
      }, 3500); // Update state after 5000ms (user stops typing)
    };
    return (
      <div className="mt-8 p-4 rounded-lg bg-[#21262D] border border-[#30363D]">
        <h3 className="text-lg font-semibold text-white mb-3">
          How was your assessment experience?
        </h3>

        {!feedbackSubmitted ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      feedbackStars >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-500"
                    } transition-colors duration-200 hover:text-yellow-300`}
                  />
                </button>
              ))}
            </div>

            <div className="mb-4">
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md bg-[#161B22] text-white"
                ref={inputRef}
                placeholder="Write your feedback..."
                onInput={handleInputChange}
              />
            </div>

            <button
              onClick={submitFeedback}
              disabled={feedbackStars === 0 || isSubmittingFeedback}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                feedbackStars > 0 && !isSubmittingFeedback
                  ? "bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] hover:opacity-90"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              {isSubmittingFeedback ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </div>
              ) : (
                "Submit Feedback"
              )}
            </button>
          </>
        ) : (
          <div className="text-center p-2 text-green-400">
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            Thank you for your feedback!
          </div>
        )}
      </div>
    );
  };

  // Completion state
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-[#161B22] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Assessment Complete!
          </h2>
          {cheatingDetected && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-20 rounded-lg">
              <p className="text-red-400">
                Warning: Violations were detected during your test session
              </p>
            </div>
          )}
          <div className="mb-6 p-4 rounded-lg bg-opacity-10 bg-white">
            <p className="text-lg text-gray-300">Skill: {skill}</p>
            <p className="text-2xl font-bold text-white">
              Score: {score.toFixed(2)}%
            </p>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => {
              const isCorrect = answers[index] === q.correctAnswer;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isCorrect ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <p className="text-white font-medium mb-2">{q.question}</p>
                  <p className={isCorrect ? "text-green-400" : "text-red-400"}>
                    Your answer: {answers[index] || "No answer provided"}
                  </p>
                  {!isCorrect && (
                    <p className="text-green-400">
                      Correct answer: {q.correctAnswer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {showFeedback && <FeedbackForm />}

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleRetake}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90"
            >
              Retake Assessment
            </button>
            <button
              onClick={handleBackToProfile}
              disabled={cheatingDetected}
              className={`flex-1 px-4 py-2 ${
                cheatingDetected
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-[#30363D] hover:opacity-90"
              } text-white rounded-lg`}
            >
              Back to Dashboard
            </button>
          </div>

          {warning && (
            <div className="mt-4 p-4 bg-yellow-500 bg-opacity-20 rounded-lg text-yellow-300">
              {warning}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main test UI
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8">
        {/* Proctoring UI */}
        <div className="fixed top-4 left-4 w-[320px] h-[180px] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {isTestStarted ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Camera className="w-8 h-8 text-gray-600" />
            </div>
          )}

          <Button
            onClick={isTestStarted ? stopTest : startTest}
            className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded"
            disabled={isAnalyzing}
          >
            {isTestStarted ? "End Test" : "Start Test"}
          </Button>

          {warning && (
            <div className="absolute bottom-2 left-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {warning}
            </div>
          )}

          {isAnalyzing && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing...
            </div>
          )}

          {testResult && (
            <div
              className={`absolute bottom-2 left-2 right-2 px-2 py-1 rounded text-white text-xs flex items-center gap-1 ${
                testResult.cheated ? "bg-red-600" : "bg-green-600"
              }`}
            >
              {testResult.cheated ? (
                <>
                  <XCircle className="w-3 h-3" />
                  Violations Detected
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  No Violations
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Quiz UI */}
        <div className="max-w-2xl w-full bg-[#161B22] rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400">
              Question {currentQuestion + 1} of {questions.length}
            </p>
            <p className="text-gray-400">Assessment: {skill}</p>
          </div>

          <div className="mb-6 w-full bg-gray-700 h-2 rounded-full">
            <div
              className="bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>

          <h2
            className="text-xl text-white font-semibold mb-4"
            dangerouslySetInnerHTML={{
              __html: md.render(questions[currentQuestion].question),
            }}
          />

          <div className="space-y-4">
            {questions[currentQuestion].options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors duration-200
                ${
                  answers[currentQuestion] === option
                    ? "bg-[#21262D] border border-[#E31D65]"
                    : "hover:bg-[#21262D] border border-transparent"
                } cursor-pointer`}
                onClick={() => handleAnswer(option)}
              >
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="question-option"
                  value={option}
                  checked={answers[currentQuestion] === option}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="w-4 h-4 text-[#E31D65] bg-gray-100 border-gray-300 focus:ring-[#E31D65]"
                />
                <label
                  htmlFor={`option-${index}`}
                  className="text-sm font-medium text-gray-300 cursor-pointer flex-1"
                  dangerouslySetInnerHTML={{ __html: md.render(option) }}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {!isTestStarted && (
              <div className="text-yellow-500 text-sm">
                Please start the proctoring system to begin the test
              </div>
            )}
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion] || !isTestStarted}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
              ${
                answers[currentQuestion] && isTestStarted
                  ? "bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] hover:opacity-90"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              {currentQuestion === questions.length - 1
                ? "Finish Assessment"
                : "Next Question"}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

const AssessmentsPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ProctoredSkillTest />
  </Suspense>
);

export default AssessmentsPage;
