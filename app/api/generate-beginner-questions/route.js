// app/api/generate-questions/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY_4;
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skill = searchParams.get("skill");
    const domain = searchParams.get("domain");

    if (!skill) {
      return NextResponse.json(
        { error: "Skill parameter is required" },
        { status: 400 }
      );
    }

    // Customize the prompt based on assessment category and domain
    let promptContent = "";

    switch (skill) {
      case "aptitude":
        promptContent = `Generate 5 multiple-choice questions to assess a beginner's aptitude and interests in the ${domain} field. Each question should help identify natural talents, preferences, and potential strengths. Format as a JSON array with each object having: "question", "options" (array of 4 choices), and "correctAnswer" (one of the options). Questions should not have objectively right/wrong answers but help reveal preferences.`;
        break;
      case "competency":
        promptContent = `Generate 5 multiple-choice questions to assess a beginner's core competencies relevant to the ${domain} field. Focus on reasoning, communication, and problem-solving abilities. Format as a JSON array with each object having: "question", "options" (array of 4 choices), and "correctAnswer" (one of the options). Questions should gradually increase in difficulty.`;
        break;
      case "values":
        promptContent = `Generate 5 multiple-choice questions to help beginners discover their values and priorities related to careers in the ${domain} field. Questions should help identify what matters most to them (stability, creativity, impact, work-life balance, etc.). Format as a JSON array with each object having: "question", "options" (array of 4 choices), and "correctAnswer" (one of the options). There are no right/wrong answers, but the "correctAnswer" should indicate what the option suggests about their values.`;
        break;
      case "self":
        promptContent = `Generate 5 multiple-choice questions for self-perception assessment related to the ${domain} field. Questions should help beginners reflect on what they think they're good at and what careers interest them. Format as a JSON array with each object having: "question", "options" (array of 4 choices), and "correctAnswer" (one of the options). There are no right/wrong answers, but the "correctAnswer" should be useful for analysis.`;
        break;
      case "personality":
        promptContent = `Generate 5 multiple-choice questions to assess personality traits relevant to careers in the ${domain} field. Base questions on established frameworks like MBTI, Big Five, or RIASEC. Format as a JSON array with each object having: "question", "options" (array of 4 choices), and "correctAnswer" (one of the options). Each option should map to different personality traits.`;
        break;
      default:
        promptContent = `Generate 5 multiple-choice questions to assess a beginner's knowledge and interest in the ${domain} field. Format as a JSON array with each object having: "question", "options" (array of 4 choices), and "correctAnswer" (one of the options).`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a career assessment expert who creates thoughtful, insightful questions to help people discover their career paths. Always return valid JSON with no additional text or markdown formatting. Do not wrap your response in code blocks.`,
    });

    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const questions = response.text();

    // Parse the JSON response from Gemini
    try {
      // Extract just the JSON part from the response that might contain markdown
      let cleanedResponse = questions.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith("```json")) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, "");
        cleanedResponse = cleanedResponse.replace(/\s*```\s*$/, "");
      } else if (cleanedResponse.startsWith("```")) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, "");
        cleanedResponse = cleanedResponse.replace(/\s*```\s*$/, "");
      }

      const parsedQuestions = JSON.parse(cleanedResponse);
      return NextResponse.json({ questions: parsedQuestions });
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      console.error("Raw response:", questions); // Log the raw response for debugging
      return NextResponse.json(
        { error: "Invalid response format from AI", raw: questions },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions", details: error.message },
      { status: 500 }
    );
  }
}
