
import { GoogleGenAI } from "@google/genai";
import { StyleRecommendation, OutfitAnalysis, PersonalizedStyleAnalysis } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const cleanBase64 = (data: string) => data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

/**
 * Analyzes personal style suitability based on body metrics and a selfie.
 */
export const analyzePersonalizedStyle = async (
  base64Image: string, 
  height: string, 
  weight: string, 
  fitnessLevel: string, 
  targetStyle: string
): Promise<PersonalizedStyleAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image)
            }
          },
          {
            text: `Please act as a personalized fashion consultant. 
            Analyze the suitability of a specific style for the person in the image, considering their physical details.
            
            **User Info**:
            - Height: ${height} cm
            - Weight: ${weight} kg
            - Fitness Level / Body Type: ${fitnessLevel}
            - Desired Style: ${targetStyle}
            
            Please provide:
            1. **Suitability Explanation**: Explain why the desired style does or does not suit their body type, height, and weight. Be encouraging but honest.
            2. **SuitabilityScore**: A score from 0 to 100 on how well this style fits them.
            3. **Recommended Alternative Styles**: 2-3 other styles that would look even better on them, with reasons.
            4. **Recommended Brands**: 3-5 clothing brands (global or local to Taiwan) that specialize in the "Desired Style".
            5. **VisualPrompt**: A detailed English paragraph for an AI image generator. Describe the person wearing a complete outfit in the "Desired Style" that compliments their physique (height: ${height}, weight: ${weight}, fitness: ${fitnessLevel}). Keep the face and background from the original image.
            
            Return ONLY a JSON object:
            {
              "suitabilityExplanation": "Detailed explanation in Traditional Chinese (Taiwan)",
              "suitabilityScore": number,
              "recommendedStyles": [
                { "name": "Style Name", "reason": "Why this suits them (Traditional Chinese)" }
              ],
              "recommendedBrands": ["Brand A", "Brand B", "Brand C"],
              "visualPrompt": "The English visual prompt here"
            }
            Ensure the JSON is valid.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Personalized analysis failed:", error);
    throw new Error("Personalized style analysis failed.");
  }
};

/**
 * Analyzes the user's outfit and provides style advice with score and grade.
 */
export const analyzeOutfit = async (base64Image: string): Promise<OutfitAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image)
            }
          },
          {
            text: `Please act as a world-class high-fashion stylist. Analyze the outfit in this image.
            
            1. **Score**: Give an overall style score from 0 to 100.
            2. **Grade**: Assign a grade (S, A, B, C, or D). S is perfect, A is excellent, B is good, C is average, D needs improvement.
            3. **Analysis**: Identify key pieces, body type interaction, and hairstyle coordination.
            4. **Critique**: Provide feedback on color, fit, and proportions.
            5. **Suggestions**: 3 specific items to elevate the look.
            
            Return ONLY a JSON object:
            {
              "score": number,
              "grade": "S" | "A" | "B" | "C" | "D",
              "analysisText": "Detailed analysis in Traditional Chinese (Taiwan) using Markdown",
              "suggestedPrompt": "A single English paragraph describing the person wearing the IMPROVED outfit for an AI image generator. Keep the original background and pose."
            }
            Ensure the JSON is valid.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Fashion analysis failed.");
  }
};

/**
 * Analyzes how a specific clothing item matches the person.
 */
export const analyzeMatch = async (personImage: string, garmentImage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(personImage) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(garmentImage) } },
          {
            text: `I have two images: Image 1 is a person, Image 2 is a clothing item.
            Act as a stylist.
            1. Analyze if the clothing item in Image 2 matches the style, body type, and vibe of the person in Image 1.
            2. Provide styling advice on how to wear this specific item.
            3. Rate the compatibility out of 10.
            
            Respond in Traditional Chinese (Taiwan). Keep it concise and helpful.`
          }
        ]
      }
    });

    return response.text || "無法分析搭配，請稍後再試。";
  } catch (error) {
    console.error("Match analysis failed:", error);
    throw new Error("Match analysis failed.");
  }
};

/**
 * Analyzes a standalone garment image and returns structured style recommendations focused on LATEST TRENDS.
 */
export const analyzeGarment = async (garmentImage: string): Promise<StyleRecommendation[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(garmentImage) } },
          {
            text: `Act as a fashion creative director specialized in LATEST TRENDS (2024-2025). Analyze the clothing item in this image.
            
            Identify 3 DISTINCT and TRENDY fashion aesthetics that this item can be styled into.
            Focus on popular styles like:
            1. **日系簡約寬鬆 (City Boy/Minimalist Loose)**: Focus on proportions, layering, and neutral tones.
            2. **美式復古運動 (American Vintage/Retro Sport)**: Focus on distressed textures, vintage graphics, and 90s vibes.
            3. **Clean Fit / 韓系精緻**: Focus on perfect tailoring, high-quality basics, and effortless elegance.
            4. **Urban Techwear / 機能風格**: Focus on utility and futuristic silhouettes.

            For each style, suggest matching with SPECIFIC LATEST TRENDY items (e.g., Wide-leg trousers, Samba sneakers, silver accessories, balaclavas, etc.).

            Return ONLY a JSON array with the following structure:
            [
              {
                "id": "style_1",
                "styleName": "風格名稱 (如：日系街頭寬鬆風格)",
                "description": "短語描述此風格的精髓 (Traditional Chinese)",
                "matchAdvice": "具體的流行單品搭配建議，例如：搭配「重磅寬版原色丹寧褲」與「復古德訓鞋」(Traditional Chinese)",
                "visualPrompt": "Detailed English description for an AI image generator. Include specific clothing details, background vibes like 'Tokyo city street' or 'LA vintage store', and lighting style."
              }
            ]`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Garment analysis failed:", error);
    throw new Error("Garment analysis failed.");
  }
};

/**
 * Edits the image to change the outfit based on a prompt.
 */
export const generateVirtualTryOn = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image),
            },
          },
          {
            text: `Change the clothing of the person in the image to match this description: ${prompt}. Keep the face, body pose, and background exactly the same. Make it look photorealistic.`,
          },
        ],
      },
      config: {
      },
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Generation failed:", error);
    throw new Error(error.message || "Virtual try-on failed.");
  }
};

/**
 * Generates a try-on image using a specific garment image.
 */
export const generateVirtualTryOnWithItem = async (personImage: string, garmentImage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(personImage) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(garmentImage) } },
          {
            text: `Photorealistic image editing: The person in the first image is wearing the clothing item from the second image. Replace original clothes naturally. Keep face/hair/background unchanged.`,
          },
        ],
      },
      config: {
      },
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Item try-on failed:", error);
    throw new Error(error.message || "Virtual try-on with item failed.");
  }
};

/**
 * Generates a model wearing the garment with specific styling.
 */
export const generateModelTryOn = async (garmentImage: string, gender: 'male' | 'female', stylePrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(garmentImage) } },
          {
            text: `Generate a full-body high-fashion editorial shot of a ${gender} model wearing the item from the image. Style context: ${stylePrompt}. Photorealistic, cinematic lighting, 8k resolution.`,
          },
        ],
      },
      config: {
      },
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    console.error("Model generation failed:", error);
    throw new Error(error.message || "Model generation failed.");
  }
};

const extractImageFromResponse = (response: any): string => {
  const candidate = response.candidates?.[0];
  if (!candidate) throw new Error("No response from AI.");
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
      throw new Error(`Generation stopped due to: ${candidate.finishReason}`);
  }
  const parts = candidate.content?.parts;
  if (parts && parts.length > 0) {
     const imagePart = parts.find((p: any) => p.inlineData);
     if (imagePart && imagePart.inlineData) {
         return `data:image/png;base64,${imagePart.inlineData.data}`;
     }
     const textPart = parts.find((p: any) => p.text);
     if (textPart && textPart.text) {
         const msg = textPart.text.length > 100 ? textPart.text.substring(0, 100) + "..." : textPart.text;
         throw new Error(`AI Refusal: ${msg}`);
     }
  }
  throw new Error("No image generated by the model.");
};
