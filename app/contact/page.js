"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Linkedin, MapPin } from "lucide-react";

const teamInfo = [
  {
    name: "Himanshu Rautela",
    email: "rohitharris01072003@gmail.com",
    linkedin: "https://www.linkedin.com/in/himanshu-rautela/"
  },
  {
    name: "Aaryan Singh",
    email: "aaryansingh@gmail.com",
    linkedin: "https://www.linkedin.com/in/aaryan-anil-kumar-singh/"
  },
  {
    name: "Kanishq Tahalyani",
    email: "kanishqqtahalyanii@gmail.com",
    linkedin: "https://www.linkedin.com/in/kanishq-tahalyani-551119257/"
  },
  {
    name: "Tarsh Swarnkar",
    email: "tarsh.swarnkar@gmail.com",
    linkedin: "https://www.linkedin.com/in/tarshswarnkar/"
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create email body with all recipients
      const emailBody = `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;
      
      // Create mailto link with all recipients
      const mailtoLink = `mailto:${teamInfo.map(member => member.email).join(',')}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open default email client
      window.location.href = mailtoLink;
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Fill out the form below or reach out to us directly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-gray-900 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] bg-clip-text text-transparent">
                Get in Touch
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-[#E31D65] mt-1" />
                  <div>
                    <h3 className="font-medium text-white">Email</h3>
                    <div className="space-y-1">
                      {teamInfo.map((member, index) => (
                        <p key={index} className="text-gray-400 text-sm">
                          {member.email}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Linkedin className="h-6 w-6 text-[#E31D65] mt-1" />
                  <div>
                    <h3 className="font-medium text-white">LinkedIn</h3>
                    <div className="space-y-1">
                      {teamInfo.map((member, index) => (
                        <a
                          key={index}
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 text-sm hover:text-[#0A66C2] transition-colors block"
                        >
                          {member.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-[#E31D65] mt-1" />
                  <div>
                    <h3 className="font-medium text-white">Location</h3>
                    <p className="text-gray-400">Kota, Rajasthan, India</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-white">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                  required
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2 text-white">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2 text-white">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E31D65]"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Send Message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 