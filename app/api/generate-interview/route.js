import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { role, techStack, experience } = await req.json();

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_3);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // Create the prompt for generating interview questions
    const prompt = `
      Generate 5 technical interview questions for a ${role} position with experience level: ${experience} years.
      The candidate has mentioned the following tech stack: ${techStack}.
      
      For each question, provide:
      1. A challenging but fair technical question that would be asked in a real interview
      2. The ideal answer to evaluate the candidate's response
      
      Format the response as a JSON array of objects with the following structure:
      [
        {
          "question": "The technical question text",
          "idealAnswer": "The ideal answer to evaluate against"
        }
      ]
      
      Make sure the questions are appropriate for the experience level and specific to the tech stack mentioned.
      Do not include any explanations or additional text outside of the JSON structure.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to generate properly formatted questions");
    }

    const questions = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ questions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating interview questions:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate interview questions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
