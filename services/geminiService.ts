import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const cleanBase64 = (data: string) => data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

/**
 * Analyzes the user's outfit and provides style advice.
 */
export const analyzeOutfit = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
            1. Identify the key pieces and the current style.
            2. Give a critique on color coordination and fit.
            3. Suggest 3 specific improvements or items that would elevate this look.
            
            Format the output in clear Markdown with headers. Keep the tone chic, encouraging, and professional.
            Respond in Traditional Chinese (Taiwan).`
          }
        ]
      }
    });

    return response.text || "無法分析圖片，請稍後再試。";
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
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(personImage) } },
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(garmentImage) } },
          {
            text: `I have two images: Image 1 is a person, Image 2 is a clothing item.
            Act as a stylist.
            1. Analyze if the clothing item in Image 2 matches the style, body type, and vibe of the person in Image 1.
            2. Provide styling advice on how to wear this specific item (e.g., tuck it in, layer it, accessories).
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
        responseModalities: [Modality.IMAGE],
      },
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Generation failed:", error);
    throw new Error("Virtual try-on failed.");
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
            text: `Create a photorealistic image of the person from the first image wearing the clothing item shown in the second image.
            - Replace the person's current relevant clothing (e.g., if the item is a top, replace the top; if it's a dress, replace the outfit) with the item in the second image.
            - Ensure the fit looks natural on the person's body type.
            - PRESERVE the person's face, hair, pose, and the original background from the first image exactly.
            - High quality, fashion photography style.`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    return extractImageFromResponse(response);

  } catch (error) {
    console.error("Item try-on failed:", error);
    throw new Error("Virtual try-on with item failed.");
  }
};

const extractImageFromResponse = (response: any): string => {
  const parts = response.candidates?.[0]?.content?.parts;
  if (parts && parts.length > 0) {
     const imagePart = parts.find((p: any) => p.inlineData);
     if (imagePart && imagePart.inlineData) {
         return `data:image/png;base64,${imagePart.inlineData.data}`;
     }
  }
  throw new Error("No image generated.");
};
