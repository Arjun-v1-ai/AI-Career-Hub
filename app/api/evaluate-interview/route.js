import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { role, techStack, experience, questions, answers } =
      await req.json();

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_3);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    // Create the prompt for evaluating interview responses
    const prompt = `
      You are an expert technical interviewer for a ${role} position.
      Experience level: ${experience} years
      Tech stack: ${techStack}
      
      You need to evaluate the candidate's responses to the interview questions.
      
      Here are the questions and the candidate's answers:
      ${questions
        .map(
          (q, index) => `
        Question ${index + 1}: ${q.question}
        Candidate's answer: ${answers[index] || "No answer provided"}
        Ideal answer: ${q.idealAnswer}
      `
        )
        .join("\n\n")}
      
      For each answer, provide feedback with the following structure:
      1. Strengths of the response
      2. Weaknesses of the response
      3. Specific suggestions for improvement
      4. Assessment of technical knowledge demonstrated
      
      Then, provide an overall score out of 10 for the entire interview, considering:
      - Technical accuracy
      - Depth of knowledge
      - Problem-solving approach
      - Communication clarity
      
      Format the response as a JSON object with the following structure:
      {
        "feedback": {
          "0": {
            "strengths": "Strengths of answer 1",
            "weaknesses": "Weaknesses of answer 1",
            "improvement": "Improvement suggestions for answer 1",
            "knowledge": "Technical knowledge assessment for answer 1"
          },
          "1": {
            "strengths": "Strengths of answer 2",
            "weaknesses": "Weaknesses of answer 2",
            "improvement": "Improvement suggestions for answer 2",
            "knowledge": "Technical knowledge assessment for answer 2"
          }
          // etc. for each question
        },
        "score": 7.5  // Overall score out of 10
      }
      
      Ensure each feedback section is concise but informative.
      Do not include any explanations or additional text outside of the JSON structure.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let evaluation;
    try {
      // First try to find a JSON object in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      // Fallback to a simple feedback format
      evaluation = {
        feedback: {},
        score: 5.0,
      };

      questions.forEach((_, index) => {
        evaluation.feedback[
          index
        ] = `We had trouble generating structured feedback for this answer. Please review the ideal answer provided with the question.`;
      });
    }

    return new Response(JSON.stringify(evaluation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error evaluating interview:", error);
    return new Response(
      JSON.stringify({ error: "Failed to evaluate interview" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
