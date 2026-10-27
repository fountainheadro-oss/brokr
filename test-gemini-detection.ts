import { GoogleGenAI, Type } from "@google/genai";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { "User-Agent": "aistudio-build" } }
});

async function run() {
  const imageUrl = "https://i.roamcdn.net/prop/imo/gallery-full-1200w-watermark/beb52091c26be93e9726ee8ad7a75c42/-eyJvdyI6Ikdlb3JnZSBMZW90ZXNjdSJ9/prod-property-core-backend-media-imo/96458034/2d70f5da-97d3-490f-bc30-6794ba8f2cf8.jpg";
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const base64 = Buffer.from(response.data).toString("base64");
    
    console.log("Sending image to Gemini with structured schema...");
    
    const prompt = "Detect all watermarks, text overlays, agent/agency stamps, phone numbers, or logos overlayed on this photo. For each item found, provide its ymin, xmin, ymax, xmax coordinates normalized from 0 to 1000.";
    
    const genResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType: "image/jpeg"
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            watermarks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.INTEGER, description: "Normalized ymin from 0 to 1000" },
                  xmin: { type: Type.INTEGER, description: "Normalized xmin from 0 to 1000" },
                  ymax: { type: Type.INTEGER, description: "Normalized ymax from 0 to 1000" },
                  xmax: { type: Type.INTEGER, description: "Normalized xmax from 0 to 1000" },
                  label: { type: Type.STRING, description: "The text or type of overlay found" }
                },
                required: ["ymin", "xmin", "ymax", "xmax"]
              }
            }
          },
          required: ["watermarks"]
        }
      }
    });

    console.log("Gemini response text with schema:", genResponse.text);
  } catch (err: any) {
    console.error("Error:", err.stack);
  }
}

run();
