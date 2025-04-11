import React, { useEffect } from "react";
import { BookOpen, Briefcase, TrendingUp, Award, Users } from "lucide-react";

const CareerGuidanceDisplay = ({ guidance }) => {
  // Function to parse the guidance into sections
  const parseSections = (text) => {
    const sections = {};

    // Define section patterns
    const sectionPatterns = [
      { name: "careerProfile", pattern: /1\.\s*Career\s*Profile\s*Analysis/i },
      { name: "careerPaths", pattern: /2\.\s*Recommended\s*Career\s*Paths/i },
      {
        name: "skillDevelopment",
        pattern: /3\.\s*Skill\s*Development\s*Roadmap/i,
      },
      {
        name: "progressionTimeline",
        pattern: /4\.\s*Career\s*Progression\s*Timeline/i,
      },
      {
        name: "additionalRecommendations",
        pattern: /5\.\s*Additional\s*Recommendations/i,
      },
    ];

    // Find the starting positions of each section
    const positions = sectionPatterns
      .map((section) => {
        const match = text.match(section.pattern);
        return {
          name: section.name,
          position: match ? match.index : -1,
        };
      })
      .filter((section) => section.position !== -1)
      .sort((a, b) => a.position - b.position);

    // Extract content for each section
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].position;
      const end =
        i < positions.length - 1 ? positions[i + 1].position : text.length;
      sections[positions[i].name] = text.substring(start, end).trim();
    }

    return sections;
  };

  // Extract career path information and save it to the database
  useEffect(() => {
    if (guidance) {
      const extractAndSaveCareerPathInfo = async () => {
        try {
          const sections = parseSections(guidance);
          const careerPathInfo = extractCareerPathInfo(sections);

          // Save the extracted information to the database
          const response = await fetch("/api/save-career-path-info", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ careerPathInfo }),
          });

          if (!response.ok) {
            console.error("Failed to save career path information");
          }
        } catch (error) {
          console.error("Error extracting career path info:", error);
        }
      };

      extractAndSaveCareerPathInfo();
    }
  }, [guidance]);

  // Function to extract career path information from parsed sections
  const extractCareerPathInfo = (sections) => {
    const careerPathInfo = {
      currentLevel: "Entry Level", // Default value
      nextSteps: [],
      recommendedRoles: [],
    };

    try {
      // Extract recommended roles from section 2
      if (sections.careerPaths) {
        // Look for role titles, typically in bold or as list items
        const roleMatches = sections.careerPaths.match(
          /[*-]\s*([\w\s-]+Developer|[\w\s-]+Engineer|[\w\s-]+Intern|[\w\s-]+Designer)/g
        );
        if (roleMatches) {
          careerPathInfo.recommendedRoles = roleMatches
            .slice(0, 4)
            .map((role) => {
              const title = role.replace(/[*-]\s*/, "").trim();
              // Try to extract level, salary, and demand info
              const levelMatch = sections.careerPaths.match(
                new RegExp(
                  `${title}[\\s\\S]*?Experience\\s*Level[\\s\\S]*?([\\w\\s-]+)`,
                  "i"
                )
              );
              const salaryMatch = sections.careerPaths.match(
                new RegExp(
                  `${title}[\\s\\S]*?Salary[\\s\\S]*?([\\$\\d,\\s\\w-]+)`,
                  "i"
                )
              );
              const demandMatch = sections.careerPaths.match(
                new RegExp(`${title}[\\s\\S]*?Demand[\\s\\S]*?([\\w]+)`, "i")
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
      if (sections.progressionTimeline) {
        // Extract short-term goals (1 year)
        const shortTermSection = sections.progressionTimeline.match(
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
          sections.progressionTimeline.toLowerCase().includes("junior") ||
          sections.progressionTimeline.toLowerCase().includes("entry")
        ) {
          careerPathInfo.currentLevel = "Entry Level";
        } else if (
          sections.progressionTimeline.toLowerCase().includes("mid") ||
          sections.progressionTimeline.toLowerCase().includes("intermediate")
        ) {
          careerPathInfo.currentLevel = "Mid-Level";
        } else if (
          sections.progressionTimeline.toLowerCase().includes("senior")
        ) {
          careerPathInfo.currentLevel = "Senior";
        }
      }

      return careerPathInfo;
    } catch (error) {
      console.error("Error extracting career path info:", error);
      return careerPathInfo; // Return default values on error
    }
  };

  const sections = parseSections(guidance);

  // Convert markdown-style formatting to HTML
  const formatText = (text) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/\|/g, " | "); // Add spaces around table separators
  };

  return (
    <div className="bg-[#161B22] rounded-lg border border-orange-600 overflow-hidden">
      <div className="p-6 border-b border-orange-600/30">
        <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text mb-2">
          Your Career Guidance Report
        </h2>
        <p className="text-gray-400">
          Personalized career insights based on your skills and background
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-orange-600/30">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-semibold text-white">Career Profile</h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {sections.careerProfile && (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatText(
                    sections.careerProfile.replace(
                      /1\.\s*Career\s*Profile\s*Analysis/i,
                      ""
                    )
                  ),
                }}
              />
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-white">Career Paths</h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {sections.careerPaths && (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatText(
                    sections.careerPaths.replace(
                      /2\.\s*Recommended\s*Career\s*Paths/i,
                      ""
                    )
                  ),
                }}
              />
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">
              Skill Development
            </h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {sections.skillDevelopment && (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatText(
                    sections.skillDevelopment.replace(
                      /3\.\s*Skill\s*Development\s*Roadmap/i,
                      ""
                    )
                  ),
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-orange-600/30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">
              Career Progression Timeline
            </h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {sections.progressionTimeline && (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatText(
                    sections.progressionTimeline.replace(
                      /4\.\s*Career\s*Progression\s*Timeline/i,
                      ""
                    )
                  ),
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-orange-600/30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">
              Additional Recommendations
            </h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {sections.additionalRecommendations && (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatText(
                    sections.additionalRecommendations.replace(
                      /5\.\s*Additional\s*Recommendations/i,
                      ""
                    )
                  ),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerGuidanceDisplay;
