//app/api/cover-letter/route.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

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
 */
async function waitForFilesActive(files) {
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name);
    }
    // if (file.state !== "ACTIVE") {
    //   throw Error(File ${file.name} failed to process);
    // }
    if (file.state !== "ACTIVE") {
      throw new Error(`File ${file.name} failed to process`);
    }
  }
}

/**
 * Extracts applicant information from resume
 */
async function extractResumeInfo(resumeFile) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const prompt = `Extract the following information from this resume:
    1. Full name of the applicant
    2. Email address
    
    Return only the extracted information in this format:
    Name: [full name]
    Email: [email address]`;

    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          mimeType: resumeFile.mimeType,
          fileUri: resumeFile.uri,
        },
      },
    ]);

    const response = result.response.text();
    const nameMatch = response.match(/Name: (.+)/);
    const emailMatch = response.match(/Email: (.+)/);

    return {
      name: nameMatch ? nameMatch[1].trim() : "Applicant Name",
      email: emailMatch ? emailMatch[1].trim() : "applicant@example.com",
    };
  } catch (error) {
    console.error("Error extracting resume info:", error);
    return {
      name: "Applicant Name",
      email: "applicant@example.com",
    };
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume");
    const generationType = formData.get("generationType");
    const companyName = formData.get("companyName");
    const jobPosition = formData.get("jobPosition");
    const jobDescription = formData.get("jobDescription");

    // Optional form field for name and email
    const formName = formData.get("applicantName");
    const formEmail = formData.get("applicantEmail");

    if (!file) {
      return NextResponse.json(
        { error: "No resume uploaded" },
        { status: 400 }
      );
    }

    if (!companyName) {
      return NextResponse.json(
        { error: "No company name provided" },
        { status: 400 }
      );
    }

    if (generationType === "specific" && (!jobPosition || !jobDescription)) {
      return NextResponse.json(
        {
          error:
            "Job position and description are required for specific job applications",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;
    const filename = file.name;

    const uploadedFile = await uploadToGemini(buffer, mimeType, filename);

    // Wait for files to be ready
    await waitForFilesActive([uploadedFile]);

    // Extract applicant information from resume
    let applicantInfo;
    if (formName && formEmail) {
      // Use provided form data if available
      applicantInfo = {
        name: formName,
        email: formEmail,
      };
    } else {
      // Extract from resume if not provided in form
      applicantInfo = await extractResumeInfo(uploadedFile);
    }

    const date = new Date();
    const options = { month: "short", day: "numeric", year: "numeric" };
    const formattedDate = date
      .toLocaleDateString("en-US", options)
      .replace(",", "");

    // Define system instructions based on the generation type
    let systemInstruction = "";

    if (generationType === "cold") {
      systemInstruction = `I will give you a resume and a company name. Create a professional cover letter for a cold application to this company. 
      
      The cover letter should:
      - Begin with the applicant's full name "${applicantInfo.name}" on one line
      - Email "${applicantInfo.email}" on a separate line
      - Current date as ${formattedDate} on its own line
      - Address the letter to "Hiring Manager" at the company name
      - Start with "Dear Hiring Manager,"
      - Highlight the applicant's key skills and experiences from the resume
      - Explain why they are interested in the company and how they align with the company's values
      - Include a call to action for an interview
      - End with "Sincerely," on one line
      - Then "${applicantInfo.name}" on a new line
      - Be around 250-300 words
      
      Important: Format this as plain text only, no markdown or HTML. Use line breaks for formatting paragraphs.`;
    } else {
      systemInstruction = `I will give you a resume, job position, and job description. Create a tailored cover letter for this specific job application.
      
      The cover letter should:
      - Begin with the applicant's full name "${applicantInfo.name}" on one line
      - Email "${applicantInfo.email}" on a separate line
      - Current date as ${formattedDate} on its own line
      - Address the letter to "Hiring Manager" at the company name
      - Start with "Dear Hiring Manager,"
      - Match the applicant's skills and experiences from the resume to the job requirements
      - Demonstrate understanding of the role and company
      - Explain why the applicant is a good fit for this specific position
      - Include a call to action for an interview
      - End with "Sincerely," on one line
      - Then "${applicantInfo.name}" on a new line
      - Be around 250-300 words
      
      Important: Format this as plain text only, no markdown or HTML. Use line breaks for formatting paragraphs.`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemInstruction,
    });

    const chatSession = model.startChat({
      generationConfig: {
        temperature: 0.7,
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

    let prompt = "";
    if (generationType === "cold") {
      prompt = `Company Name: ${companyName}
      
      Please generate a professional cover letter for a cold application to this company based on the resume I've uploaded.`;
    } else {
      prompt = `Company Name: ${companyName}
      Job Position: ${jobPosition}
      Job Description: ${jobDescription}
      
      Please generate a tailored cover letter for this specific job application based on the resume I've uploaded.`;
    }

    const result = await chatSession.sendMessage(prompt);
    const coverLetterText = result.response.text();

    return NextResponse.json({
      coverLetter: coverLetterText,
      applicantName: applicantInfo.name,
      applicantEmail: applicantInfo.email,
    });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return NextResponse.json(
      {
        error:
          "An error occurred while generating the cover letter: " +
          error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Cover letter API is running!" });
}
