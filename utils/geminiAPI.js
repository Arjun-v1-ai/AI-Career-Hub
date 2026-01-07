// utils/geminiAPI.js
import axios from 'axios';

class GeminiAPI {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    // this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
  }

  async generateQuestions(skill) {
    const prompt = `Generate 10 multiple choice questions to test someone's knowledge of ${skill}. 
    Each question should have 4 options and one correct answer.
    Return the response in this exact JSON format:
    [
      {
        "question": "Question text here?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "The correct option text"
      }
    ]
    Make sure the questions are easy to moderate and cover different aspects of ${skill}.`;

    const options = {
      method: 'POST',
      url: `${this.baseUrl}?key=${this.apiKey}`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        },
      }
    };

    try {
      const response = await axios.request(options);
      const text = response.data.candidates[0].content.parts[0].text;
      // Extract JSON from the response text
      const jsonStr = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
      return JSON.parse(jsonStr);
    } 
    catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions');
    }
  }
}

export default GeminiAPI;