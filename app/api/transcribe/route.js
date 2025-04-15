import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API route handler
export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("audio");
    const questionId = formData.get("questionId");

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert blob to buffer directly without saving to filesystem
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File object that OpenAI can use
    const file = new File([buffer], "audio.webm", { type: "audio/webm" });

    // Transcribe the audio directly without saving to filesystem
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en",
    });

    return NextResponse.json({
      transcription: response.text,
      questionId,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process transcription" },
      { status: 500 }
    );
  }
}
