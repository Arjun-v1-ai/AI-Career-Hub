// app/api/resume-analysis/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import MarkdownIt from "markdown-it"; // Import MarkdownIt

const md = new MarkdownIt(); // Create a markdown-it instance

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

/**
 * Uploads the given file to Gemini by saving it to temp system, and delete it after.
 */
async function uploadToGemini(buffer, mimeType, filename) {
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, filename);

  // Write buffer to a temp file
  await fs.writeFile(tempFilePath, buffer);

  const uploadResult = await fileManager.uploadFile(tempFilePath, {
    mimeType,
    displayName: filename,
  });
  // Delete temp file
  await fs.unlink(tempFilePath);
  const file = uploadResult.file;
  return file;
}

/**
 * Waits for the given files to be active.
 *
 * Some files uploaded to the Gemini API need to be processed before they can
 * be used as prompt inputs. The status can be seen by querying the file's
 * "state" field.
 *
 * This implementation uses a simple blocking polling loop. Production code
 * should probably employ a more sophisticated approach.
 */
async function waitForFilesActive(files) {
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name);
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: "No job description provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const filename = file.name;

    const uploadedFile = await uploadToGemini(buffer, mimeType, filename);

    // Some files have a processing delay. Wait for them to be ready.
    await waitForFilesActive([uploadedFile]);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `I will give you a resume and a job description. Compare the resume against the job description and
      provide the following in markdown format:
      - A single number score out of 10 (show how much out of 10 eg. 8/10)
      - **Good points:** (in a single line)
      - **Missing points:** (in a single line)
      - **Possible additional points:** (in a single line)
      Be thoughtful and give feedbacks.`, // Added markdown formatting to system instruction
    });

    const chatSession = model.startChat({
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      },
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: uploadedFile.mimeType,
                fileUri: uploadedFile.uri,
              },
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(
      `Job Description: ${jobDescription}`
    );
    const text = result.response.text();
    const renderedText = md.render(text); // Render the text with markdown-it

    return NextResponse.json({ analysis: renderedText }); // Return the rendered markdown
  } catch (error) {
    console.error("Error analyzing resume:", error);
    return NextResponse.json(
      { error: "An error occurred while analyzing the resume" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Hello from the API!" });
}
