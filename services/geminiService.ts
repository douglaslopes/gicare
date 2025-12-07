import { GoogleGenAI, Type } from "@google/genai";
import { ParsedAppointment } from "../types";

const parseAppointmentWithGemini = async (input: string, todayDate: string): Promise<ParsedAppointment | null> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Current Date: ${todayDate}. User Input: "${input}". 
      Extract the appointment details. If no year is specified, assume current or next occurrence. 
      If no specific location, use "Não informado".
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Purpose of the appointment" },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            time: { type: Type.STRING, description: "HH:mm format 24h" },
            location: { type: Type.STRING, description: "Location or clinic name" }
          },
          required: ["title", "date", "time", "location"]
        }
      }
    });

    const text = response.text;
    if (text) {
        // Cleaning potential Markdown formatting (```json ... ```) that might break JSON.parse
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText) as ParsedAppointment;
    }
    return null;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    return null;
  }
};

export { parseAppointmentWithGemini };
