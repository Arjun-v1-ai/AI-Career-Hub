// app/api/analyze-assessment/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GOOGLE_API_KEY_4;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { domain, categories, responses } = body;

    if (!domain || !categories || !responses) {
      return NextResponse.json(
        { error: "Missing required data: domain, categories, or responses" },
        { status: 400 }
      );
    }

    // Format the responses for analysis
    const formattedResponses = Object.entries(responses).map(([key, value]) => {
      const [category, questionIndex] = key.split("_");
      return {
        category,
        questionIndex: parseInt(questionIndex),
        response: value,
      };
    });

    // Group responses by category
    const responsesByCategory = {};
    categories.forEach((category) => {
      responsesByCategory[category] = formattedResponses
        .filter((item) => item.category === category)
        .sort((a, b) => a.questionIndex - b.questionIndex)
        .map((item) => item.response);
    });

    // Format the prompt for Gemini
    const promptContent = `
I have responses from a career assessment for someone interested in the ${domain} field. 
For each assessment category, here are their responses:

${categories
  .map(
    (category) => `
${category.toUpperCase()} RESPONSES:
${responsesByCategory[category]
  .map((response, i) => `Q${i + 1}: ${response}`)
  .join("\n")}
`
  )
  .join("\n")}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: `You are a career assessment AI specializing in balanced, non-prescriptive career guidance.

Based on assessment responses, generate a detailed career assessment report with the following structure:
{
  "summary": "A balanced 2-3 sentence overview acknowledging both potential fit for traditional and emerging roles in the chosen field",
  "strengths": ["List 4-5 specific strengths based on responses, noting how they might apply to different career paths"],
  "careerPaths": [
    {"traditional": "A traditional career path", "description": "Brief description with realistic success metrics"},
    {"traditional": "Another established career path", "description": "Brief description with realistic success metrics"},
    {"alternative": "An alternative path others have successfully taken", "description": "How this differs from traditional routes"},
    {"emerging": "An emerging role that didn't exist 5-10 years ago", "description": "Why this field is growing and required skills"}
  ],
  "detailedAnalysis": [
    "Balanced paragraph analyzing aptitude & interests, noting multiple ways these could manifest professionally",
    "Paragraph on core competencies that acknowledges both strengths and areas for development",
    "Paragraph on values & priorities that frames these as decision-making tools rather than limitations",
    "Paragraph on self-perception that validates their view while offering additional perspectives",
    "Paragraph on personality traits that emphasizes adaptability rather than fixed characteristics"
  ],
  "decisionFramework": [
    "A framework question to help evaluate options based on their values",
    "A framework question to help assess skill-fit with potential paths",
    "A framework question to help consider work environment preferences",
    "A framework question to help balance short-term needs with long-term goals"
  ],
  "nextSteps": [
    "An action step for exploring traditional paths",
    "An action step for investigating emerging opportunities",
    "A skill development recommendation that would benefit multiple paths",
    "A networking/mentorship suggestion that provides exposure to different career realities"
  ]
}

Ensure the analysis presents balanced options without being overly prescriptive. Include both traditional and non-traditional paths, and provide frameworks for decision-making rather than definitive answers. Return VALID JSON only with no additional text or markdown formatting.`,
    });

    const result = await model.generateContent(promptContent);
    const response = await result.response;
    let analysisResponse = response.text();

    try {
      // Remove any markdown code block markers if present
      analysisResponse = analysisResponse.replace(/```json|```/g, "").trim();

      // Parse the JSON response from Gemini
      const parsedResults = JSON.parse(analysisResponse);

      // Reformat the results to match the expected frontend structure
      // while preserving the balanced counseling approach
      const reformattedResults = {
        summary: parsedResults.summary,
        strengths: parsedResults.strengths,
        careerPaths: parsedResults.careerPaths.map((path) => {
          const type = Object.keys(path)[0]; // traditional, alternative, or emerging
          return `${path[type]} (${type}): ${path.description}`;
        }),
        detailedAnalysis: parsedResults.detailedAnalysis,
        nextSteps: [
          ...parsedResults.nextSteps,
          ...parsedResults.decisionFramework.map(
            (framework) => `Consider: ${framework}`
          ),
        ],
      };

      return NextResponse.json({ results: reformattedResults });
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      return NextResponse.json(
        { error: "Invalid response format from AI", raw: analysisResponse },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze assessment results", details: error.message },
      { status: 500 }
    );
  }
}
