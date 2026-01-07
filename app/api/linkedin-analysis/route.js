// app/api/linkedin-analysis/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

const apiKey = process.env.GOOGLE_API_KEY_5;
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
    const file = formData.get("linkedin");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const filename = file.name;

    const uploadedFile = await uploadToGemini(buffer, mimeType, filename);

    // Some files have a processing delay. Wait for them to be ready.
    await waitForFilesActive([uploadedFile]);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a career advisor analyzing a LinkedIn profile in PDF format. Your task is to provide constructive feedback on how to improve the profile to make it more effective.
      Analyze the following LinkedIn profile and provide a detailed critique, covering these areas:
      
      Overall Summary:
      - Evaluate the clarity and impact of the summary.
      - Suggest ways to make it more engaging or informative.
      - Advise on whether it effectively highlights key skills and career goals.
      
      Experience Section:
      - Assess how well the candidate describes their responsibilities and achievements.
      - Provide suggestions on using action verbs, quantifying results, and structuring descriptions for better readability.
      - Analyze if the experience descriptions are tailored to the desired job profile.
      
      Skills Section:
      - Evaluate the relevance and presentation of the skills listed.
      - Suggest additional skills that might be beneficial, if applicable.
      - Advise on the importance of endorsements and recommendations.
      
      Education Section:
      - Assess the clarity and completeness of the education information.
      - Suggest any additional details that could enhance this section (e.g., relevant coursework, GPA, honors).
      
      Recommendations (If Present):
      - If recommendations are included, analyze their quality and relevance.
      - Provide advice on how to obtain more effective recommendations.
      
      Overall Presentation and Formatting:
      - Evaluate the visual appeal and organization of the profile.
      - Suggest improvements to formatting, layout, and use of white space.
      
      Actionable Suggestions:
      - Provide a list of concrete, actionable steps the candidate can take to improve their LinkedIn profile.
      
      Format your response in markdown with clear headings (using ## for main sections and ### for subsections), bullet points, and sections. Use **bold** for important points. Be specific, constructive, and encouraging in your feedback.`,
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
      "Please analyze this LinkedIn profile PDF and provide detailed feedback as specified in your instructions."
    );
    const text = result.response.text();

    // Add custom CSS classes to enhance the rendered markdown
    let renderedText = md.render(text);

    // Add styling to headings and sections
    renderedText = renderedText
      .replace(/<h2>/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-white">')
      .replace(
        /<h3>/g,
        '<h3 class="text-lg font-semibold mt-4 mb-2 text-[#FF6B2B]">'
      )
      .replace(
        /<ul>/g,
        '<ul class="list-disc pl-5 mb-4 space-y-1 text-gray-300">'
      )
      .replace(
        /<ol>/g,
        '<ol class="list-decimal pl-5 mb-4 space-y-1 text-gray-300">'
      )
      .replace(/<li>/g, '<li class="mb-1">')
      .replace(/<p>/g, '<p class="mb-3 text-gray-300">')
      .replace(/<strong>/g, '<strong class="text-white font-semibold">');

    return NextResponse.json({ analysis: renderedText });
  } catch (error) {
    console.error("Error analyzing LinkedIn profile:", error);
    return NextResponse.json(
      { error: "An error occurred while analyzing the LinkedIn profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "LinkedIn analysis API endpoint" });
}
