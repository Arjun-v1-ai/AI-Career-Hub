import React from "react";
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

  const sections = parseSections(guidance);

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
                  __html: sections.careerProfile
                    .replace(/1\.\s*Career\s*Profile\s*Analysis/i, "")
                    .replace(/\n/g, "<br>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
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
                  __html: sections.careerPaths
                    .replace(/2\.\s*Recommended\s*Career\s*Paths/i, "")
                    .replace(/\n/g, "<br>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
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
                  __html: sections.skillDevelopment
                    .replace(/3\.\s*Skill\s*Development\s*Roadmap/i, "")
                    .replace(/\n/g, "<br>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
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
                  __html: sections.progressionTimeline
                    .replace(/4\.\s*Career\s*Progression\s*Timeline/i, "")
                    .replace(/\n/g, "<br>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
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
                  __html: sections.additionalRecommendations
                    .replace(/5\.\s*Additional\s*Recommendations/i, "")
                    .replace(/\n/g, "<br>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
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
