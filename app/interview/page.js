"use client";
import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import MarkdownIt from "markdown-it";
import Loader from "@/components/Loader";

import {
  Camera,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { ProtectedRoute } from "@/services/routeProtectionService";

const md = new MarkdownIt();

const Interview = () => {
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const techStack = searchParams.get("techStack");
  const experience = searchParams.get("experience");

  // Interview proctoring states
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState(null);
  const [warning, setWarning] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Interview states
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/generate-interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            techStack,
            experience,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate interview questions");
        }

        const data = await response.json();
        setQuestions(data.questions);
      } catch (error) {
        setError(error.message);
        console.error("Failed to load questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (role && techStack) {
      loadQuestions();
    }
  }, [role, techStack, experience]);

  // Video stream effect
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Interview functions
  const startInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setIsInterviewStarted(true);
      setWarning(null);
      setInterviewResult(null);
    } catch (err) {
      setWarning("Please allow camera and microphone access to continue");
      console.error("Media access error:", err);
    }
  };

  const stopInterview = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsInterviewStarted(false);
    }
  };

  const startRecording = () => {
    if (!stream) {
      setWarning("Please start the interview first");
      return;
    }

    setIsRecording(true);
    audioChunksRef.current = [];

    const audioStream = new MediaStream(stream.getAudioTracks());

    const mediaRecorder = new MediaRecorder(audioStream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("questionId", currentQuestion);

        setIsProcessing(true);
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to transcribe audio");
        }

        const data = await response.json();
        setTranscription(data.transcription);
        setCurrentAnswer(data.transcription);
      } catch (error) {
        console.error("Transcription error:", error);
        setWarning("Failed to transcribe your answer. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveAnswer = () => {
    if (!currentAnswer.trim()) {
      setWarning("Please provide an answer before continuing");
      return;
    }

    setAnswers((prev) => ({ ...prev, [currentQuestion]: currentAnswer }));
    setCurrentAnswer("");
    setTranscription("");
  };

  const handleNext = () => {
    saveAnswer();

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          techStack,
          experience,
          questions,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate interview");
      }

      const data = await response.json();
      setScore(data.score);
      setFeedback(data.feedback);
      setIsComplete(true);
      stopInterview();
    } catch (error) {
      console.error("Evaluation error:", error);
      setWarning("Failed to evaluate your interview. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setCurrentAnswer("");
    setTranscription("");
    setScore(null);
    setFeedback({});
    setIsComplete(false);
    setInterviewResult(null);
    startInterview();
  };

  const handleBackToProfile = () => {
    window.location.href = "/dashboard";
  };

  // Loading state
  // Import the Loader component

  // Then in your component where you check for loading:
  if (loading) {
    return <Loader message="Preparing your interview" />;
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
            No questions available for {role} interview
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

  // Completion state
  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-[#161B22] rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Interview Complete!
          </h2>

          <div className="mb-6 p-4 rounded-lg bg-opacity-10 bg-white">
            <p className="text-lg text-gray-300">Position: {role}</p>
            <p className="text-lg text-gray-300">Tech Stack: {techStack}</p>
            <p className="text-2xl font-bold text-white">Score: {score}/10</p>
          </div>

          <div className="space-y-6">
            {questions.map((q, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-700"
              >
                <p className="text-white font-medium mb-2">{q.question}</p>
                <p className="text-gray-300 mb-2">
                  Your answer: {answers[index] || "No answer provided"}
                </p>
                <div className="mt-2 p-3 bg-[#21262D] rounded-lg">
                  <p className="text-green-400 font-medium">Feedback:</p>
                  {/* Replace this line: */}
                  {/* <p className="text-gray-300">{feedback[index] || "No feedback available"}</p> */}

                  {/* With this code: */}
                  {typeof feedback[index] === "string" ? (
                    <p className="text-gray-300">{feedback[index]}</p>
                  ) : feedback[index] ? (
                    <div className="text-gray-300">
                      {feedback[index].strengths && (
                        <div className="mb-2">
                          <span className="font-medium text-blue-400">
                            Strengths:{" "}
                          </span>
                          <span>{feedback[index].strengths}</span>
                        </div>
                      )}
                      {feedback[index].weaknesses && (
                        <div className="mb-2">
                          <span className="font-medium text-yellow-400">
                            Areas for improvement:{" "}
                          </span>
                          <span>{feedback[index].weaknesses}</span>
                        </div>
                      )}
                      {feedback[index].improvement && (
                        <div className="mb-2">
                          <span className="font-medium text-purple-400">
                            Suggestions:{" "}
                          </span>
                          <span>{feedback[index].improvement}</span>
                        </div>
                      )}
                      {feedback[index].knowledge && (
                        <div className="mb-2">
                          <span className="font-medium text-green-400">
                            Technical knowledge:{" "}
                          </span>
                          <span>{feedback[index].knowledge}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-300">No feedback available</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleRetake}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90"
            >
              Retake Interview
            </button>
            <button
              onClick={handleBackToProfile}
              className="flex-1 px-4 py-2 bg-[#30363D] hover:opacity-90 text-white rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Added button to navigate to job scraper */}
          <div className="mt-4">
            <button
              onClick={() => (window.location.href = "/job-scraper")}
              className="w-full px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90"
            >
              Find Job Opportunities
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

  // Main interview UI
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0D1117] flex flex-col items-center justify-center p-8">
        {/* Video monitoring UI */}
        <div className="fixed top-4 left-4 w-[320px] h-[180px] bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {isInterviewStarted ? (
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
            onClick={isInterviewStarted ? stopInterview : startInterview}
            className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-sm rounded"
            disabled={isProcessing}
          >
            {isInterviewStarted ? "End Interview" : "Start Interview"}
          </Button>

          {warning && (
            <div className="absolute bottom-2 left-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {warning}
            </div>
          )}

          {isProcessing && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 text-xs rounded flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </div>
          )}
        </div>

        {/* Main Interview UI */}
        <div className="max-w-2xl w-full bg-[#161B22] rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400">
              Question {currentQuestion + 1} of {questions.length}
            </p>
            <p className="text-gray-400">Interview: {role}</p>
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
              __html: md.render(questions[currentQuestion]?.question || ""),
            }}
          />

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#21262D] border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-medium">Your Answer</h3>
                <div className="flex items-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!isInterviewStarted || isProcessing}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3 h-3" /> Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" /> Record
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isProcessing ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Your answer will appear here after recording, or you can type it directly..."
                  className="w-full h-40 p-3 bg-[#0D1117] text-gray-300 rounded-lg border border-gray-700 resize-none focus:outline-none focus:border-[#E31D65]"
                />
              )}

              {transcription && (
                <div className="mt-2 p-2 bg-[#2D333B] rounded text-gray-300 text-sm">
                  <p className="font-medium text-green-400">Transcription:</p>
                  <p>{transcription}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            {!isInterviewStarted && (
              <div className="text-yellow-500 text-sm">
                Please start the interview system to begin
              </div>
            )}
            <button
              onClick={handleNext}
              disabled={!isInterviewStarted || isProcessing}
              className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all duration-200
              ${
                isInterviewStarted && !isProcessing
                  ? "bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] hover:opacity-90"
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              {currentQuestion === questions.length - 1
                ? "Complete Interview"
                : "Next Question"}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

const InterviewPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Interview />
  </Suspense>
);

export default InterviewPage;
