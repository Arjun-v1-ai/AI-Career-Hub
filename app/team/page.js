"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Github, Linkedin, Twitter } from "lucide-react";

const teamMembers = [
  {
    name: "Tarsh",
    role: "Team Member",
    image: "/mentors/tarsh.jpeg",
    description: "Passionate about AI and career development, leading the vision of AI Career Hub.",
    social: {
      linkedin: "https://www.linkedin.com/in/tarshswarnkar/",
      twitter: "https://twitter.com",
      github: "https://github.com/T1A0R3S2H"
    }
  },
  {
    name: "Kanishq",
    role: "Team Member",
    image: "/mentors/kanishq.jpeg",
    description: "Technical expert driving innovation in AI-powered career solutions.",
    social: {
      linkedin: "https://www.linkedin.com/in/kanishq-tahalyani-551119257/",
      twitter: "https://twitter.com",
      github: "https://github.com/KanishqJOD"
    }
  },
  {
    name: "Himanshu",
    role: "Team Member",
    image: "/mentors/himanshu.jpeg",
    description: "Full-stack developer building robust and scalable solutions.",
    social: {
      linkedin: "https://www.linkedin.com/in/himanshu-rautela/",
      twitter: "https://twitter.com",
      github: "https://github.com/himanshu07rautela"
    }
  },
  {
    name: "Aaryan",
    role: "Team Member",
    image: "/mentors/aaryannn.jpg",
    description: "Ensuring our products meet user needs and deliver exceptional value.",
    social: {
      linkedin: "https://www.linkedin.com/in/aaryan-anil-kumar-singh/",
      twitter: "https://twitter.com",
      github: "https://github.com/Aaryan-9"
    }
  }
];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-[#0D1117] text-white py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] bg-clip-text text-transparent">
            Our Team
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Meet the passionate individuals behind AI Career Hub, dedicated to revolutionizing career development through AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-900 rounded-xl overflow-hidden shadow-lg group"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex justify-center space-x-4">
                    <motion.a
                      href={member.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, color: "#0A66C2" }}
                      className="text-white hover:text-[#0A66C2] transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </motion.a>
                    <motion.a
                      href={member.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, color: "#1DA1F2" }}
                      className="text-white hover:text-[#1DA1F2] transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </motion.a>
                    <motion.a
                      href={member.social.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ y: -3, color: "#ffffff" }}
                      className="text-white hover:text-white transition-colors"
                    >
                      <Github className="h-5 w-5" />
                    </motion.a>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  {member.name}
                </h3>
                <p className="text-[#E31D65] mb-2 font-medium">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 