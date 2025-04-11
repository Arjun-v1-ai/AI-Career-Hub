// app/api/career-guidance/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { models } from "@/models/User";
import connectDB from "@/lib/mongodb";
const { User } = models;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Helper function to extract career path information from guidance text
function extractCareerPathInfo(guidanceText) {
  const careerPathInfo = {
    currentLevel: "Entry Level", // Default value
    nextSteps: [],
    recommendedRoles: [],
  };

  try {
    // Extract recommended roles from section 2
    const careerPathsSection = guidanceText.match(
      /2\.\s*Recommended\s*Career\s*Paths[\s\S]*?(?=3\.|$)/i
    );
    if (careerPathsSection && careerPathsSection[0]) {
      // Look for role titles, typically in bold or as list items
      const roleMatches = careerPathsSection[0].match(
        /[*-]\s*([\w\s]+)(?::|Developer|Engineer|Architect|Designer|Manager|Specialist)/g
      );
      if (roleMatches) {
        careerPathInfo.recommendedRoles = roleMatches
          .slice(0, 4)
          .map((role) => {
            const title = role.replace(/[*-]\s*/, "").trim();
            // Try to extract level, salary, and demand info
            const levelMatch = careerPathsSection[0].match(
              new RegExp(
                `${title}[\\s\\S]*?experience\\s*level[\\s\\S]*?([\\w\\s-]+)`,
                "i"
              )
            );
            const salaryMatch = careerPathsSection[0].match(
              new RegExp(
                `${title}[\\s\\S]*?salary[\\s\\S]*?([\\$\\d,\\s\\w-]+)`,
                "i"
              )
            );
            const demandMatch = careerPathsSection[0].match(
              new RegExp(`${title}[\\s\\S]*?demand[\\s\\S]*?([\\w]+)`, "i")
            );

            return {
              title,
              level: levelMatch ? levelMatch[1].trim() : "",
              salary: salaryMatch ? salaryMatch[1].trim() : "",
              demand: demandMatch ? demandMatch[1].trim() : "",
            };
          });
      }
    }

    // Extract career progression timeline from section 4
    const timelineSection = guidanceText.match(
      /4\.\s*Career\s*Progression\s*Timeline[\s\S]*?(?=5\.|$)/i
    );
    if (timelineSection && timelineSection[0]) {
      // Extract short-term goals (1 year)
      const shortTermSection = timelineSection[0].match(
        /Short-term\s*goals[\s\S]*?(?=Mid-term|$)/i
      );
      if (shortTermSection && shortTermSection[0]) {
        const shortTermRoles = shortTermSection[0].match(
          /[*-]\s*([\w\s]+Developer|[\w\s]+Engineer|[\w\s]+Specialist|[\w\s]+Analyst)/g
        );
        if (shortTermRoles && shortTermRoles.length > 0) {
          careerPathInfo.nextSteps = shortTermRoles
            .slice(0, 2)
            .map((role) => role.replace(/[*-]\s*/, "").trim());
        }
      }

      // Try to determine current level from context
      if (
        timelineSection[0].toLowerCase().includes("junior") ||
        timelineSection[0].toLowerCase().includes("entry")
      ) {
        careerPathInfo.currentLevel = "Entry Level";
      } else if (
        timelineSection[0].toLowerCase().includes("mid") ||
        timelineSection[0].toLowerCase().includes("intermediate")
      ) {
        careerPathInfo.currentLevel = "Mid-Level";
      } else if (timelineSection[0].toLowerCase().includes("senior")) {
        careerPathInfo.currentLevel = "Senior";
      }
    }

    return careerPathInfo;
  } catch (error) {
    console.error("Error extracting career path info:", error);
    return careerPathInfo; // Return default values on error
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();

    // Fetch user data
    const user = await User.findOne({ mailId: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if username exists
    if (!user.username) {
      return NextResponse.json(
        {
          error:
            "Please complete your basic profile before requesting career guidance",
        },
        { status: 400 }
      );
    }

    // If career guidance already exists, return it
    if (user.careerGuidance) {
      return NextResponse.json({ guidance: user.careerGuidance });
    }

    // Check if all skills have scores
    const allSkillsHaveScores = user.skills.every((skill) =>
      user.skillScores?.some((score) => score.skill === skill)
    );

    if (!allSkillsHaveScores) {
      return NextResponse.json(
        {
          error:
            "Please complete skill assessments for all skills before requesting career guidance",
        },
        { status: 400 }
      );
    }

    // Prepare skills data for prompt
    const skillsText = user.skillScores
      .map((score) => `${score.skill}: ${score.score}/100`)
      .join("\n");

    // Create prompt for Gemini
    const prompt = `Act as a career counselor with extensive experience in technology and professional development.

Personal Information:
Name: ${user.username}
Domain of Interest: ${user.domain}${
      user.otherDomain ? ` (${user.otherDomain})` : ""
    }
Gender: ${user.gender}
Country: ${user.country}
State: ${user.state}

Current Skills and Proficiency (out of 100):
${skillsText}

Please provide a detailed career guidance report with the following sections:

1. Career Profile Analysis
- Analyze the current skill set and its relevance in the specified domain
- Identify key strengths and areas of competitive advantage
- Consider geographical and market-specific factors based on the user's location

2. Recommended Career Paths
List at least 3 specific job roles/positions that align with the skill set. For each role, provide:
- Required experience level
- Expected salary range in the specified country
- Market demand (high/medium/low) with supporting reasons
- Growth potential over the next 5 years

3. Skill Development Roadmap
- Identify skill gaps for each recommended career path
- Provide a prioritized list of skills to acquire
- Recommend specific certifications or training programs
- Include timeline estimates for skill acquisition

4. Career Progression Timeline
Create a 5-year career progression roadmap with:
- Short-term goals (1 year)
- Mid-term goals (2-3 years)
- Long-term goals (4-5 years)
Include potential roles and positions at each stage
Suggest key milestones and achievements to target

5. Additional Recommendations
- Networking opportunities and professional communities to join
- Industry-specific events or conferences
- Portfolio development suggestions
- Personal branding strategies

Please provide detailed, actionable insights that take into account the individual's background, current location, and market conditions. Include specific examples and resources where applicable.
`;

    // Get Gemini model and generate response
    // const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const guidance = result.response.text();

    // Extract career path information
    const careerPathInfo = extractCareerPathInfo(guidance);

    // Save guidance and career path info to database
    try {
      user.careerGuidance = guidance;
      user.careerPathInfo = careerPathInfo;
      await user.save();
    } catch (saveError) {
      console.error("Error saving to database:", saveError);
      return NextResponse.json(
        { error: "Failed to save career guidance to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ guidance });
  } catch (error) {
    console.error("Error generating career guidance:", error);
    return NextResponse.json(
      { error: "Failed to generate career guidance" },
      { status: 500 }
    );
  }
}
