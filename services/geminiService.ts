import { GoogleGenAI, Type, SchemaParams } from "@google/genai";
import { PresentationFramework, AIOutlineItem } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = "gemini-3-flash-preview"; 
const imageModelName = "gemini-2.5-flash-image";

export interface AnalysisResult {
  title: string;
  description: string;
  tags: string[];
  framework: string;
  isObfuscatedCandidate: boolean;
}

export const analyzePresentation = async (htmlContent: string): Promise<AnalysisResult> => {
  const schema: SchemaParams = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "A catchy title for the presentation derived from content." },
      description: { type: Type.STRING, description: "A 2-sentence summary of the presentation." },
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "5 relevant SEO tags." },
      framework: { type: Type.STRING, description: "Guessed framework: Reveal.js, Impress.js, or Custom." },
      isObfuscatedCandidate: { type: Type.BOOLEAN, description: "True if the content contains sensitive PII or confidential markers." },
    },
    required: ["title", "description", "tags", "framework", "isObfuscatedCandidate"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Analyze the following HTML presentation content (or snippet) and extract metadata. 
      
      HTML Snippet (first 10000 chars):
      ${htmlContent.substring(0, 10000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback
    return {
      title: "Untitled Presentation",
      description: "No description available.",
      tags: ["html", "presentation"],
      framework: "Custom HTML",
      isObfuscatedCandidate: false,
    };
  }
};

export const obfuscateContent = async (htmlContent: string): Promise<string> => {
  // A simplified obfuscation that replaces text content with Lorem Ipsum variants
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `You are a privacy engine. I will give you HTML code. 
      Your task is to replace ONLY the readable text content within headings (h1-h6), paragraphs (p), and list items (li) with professional-sounding placeholder text (e.g., "Strategic implementation of core assets").
      
      Do NOT change class names, ids, styles, script tags, or layout structure. 
      Do NOT change image src attributes unless they look like personal photos (ignore for now).
      Retain the HTML structure exactly.
      
      Input HTML:
      ${htmlContent.substring(0, 15000)}`, // Limit for demo
    });

    return response.text || htmlContent;
  } catch (error) {
    console.error("Gemini Obfuscation Failed:", error);
    return htmlContent;
  }
};

export const generateThumbnail = async (htmlContent: string, style: string = 'Modern'): Promise<string | null> => {
  try {
    // Strip HTML tags to get raw text for the prompt
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').substring(0, 800).trim();
    
    // Fallback if no text content found
    const prompt = textContent 
      ? `Create a ${style} style presentation thumbnail image representing this topic: ${textContent}. High quality, 4k, artistic. Do not include text in the image.`
      : `Create a ${style} style presentation thumbnail image. High quality, 4k.`;

    const response = await ai.models.generateContent({
      model: imageModelName,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Thumbnail generation failed", e);
    return null;
  }
};

export const stylizeSlide = async (htmlContent: string, thumbnailSource: string): Promise<string> => {
  try {
    let base64Data = "";

    if (thumbnailSource.startsWith('http')) {
        // Fetch the image if it's a URL
        try {
            const response = await fetch(thumbnailSource);
            const blob = await response.blob();
            base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                   if (typeof reader.result === 'string') {
                       resolve(reader.result.split(',')[1]);
                   } else {
                       reject("Failed to read blob");
                   }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Failed to fetch thumbnail for styling:", e);
            return htmlContent; 
        }
    } else if (thumbnailSource.includes(',')) {
        // It's a data URI
        base64Data = thumbnailSource.split(',')[1];
    } else {
        base64Data = thumbnailSource;
    }
    
    const prompt = `
    You are a professional frontend engineer and designer.
    I will provide you with an HTML file representing a presentation slide and a reference image.
    
    Task:
    Rewrite the HTML and CSS of the slide to match the visual style (colors, fonts, background, mood) of the reference image.
    
    CRITICAL RULES FOR CONTENT PRESERVATION:
    1. **PRESERVE TEXT**: You MUST retain 100% of the original text content.
    2. **PRESERVE IMAGES**: Keep original <img> tags unless they are purely decorative.
    
    CRITICAL RULES FOR VISIBILITY:
    1. **CONTRAST**: Ensure text color has high contrast against the new background.
    2. **VISIBILITY**: Ensure the container has visible dimensions (height: 100vh or similar).
    
    STRUCTURAL RULES:
    1. **STANDALONE**: Return a valid, standalone HTML document (<!DOCTYPE html>...</html>).
    2. **SELF-CONTAINED**: Include all CSS in a <style> block within the <head>.
    
    Input HTML:
    ${htmlContent}
    
    Output:
    Return ONLY the HTML code.
    `;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: {
            parts: [
                { inlineData: { mimeType: "image/png", data: base64Data } },
                { text: prompt }
            ]
        }
    });
    
    let text = response.text || htmlContent;
    
    const codeBlockMatch = text.match(/```html([\s\S]*?)```/);
    if (codeBlockMatch) {
        text = codeBlockMatch[1].trim();
    } else {
        text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    }
    
    return text;
  } catch (error) {
    console.error("Styling failed", error);
    return htmlContent;
  }
};

// --- New AI Creator Functions ---

export const generateOutline = async (topic: string, content: string, audience: string, style: string): Promise<AIOutlineItem[]> => {
  const prompt = `
    You are a presentation expert. Create a detailed presentation outline (6-10 slides) based on:
    Topic: ${topic}
    Raw Content/Notes: ${content}
    Audience: ${audience}
    Visual Style: ${style}

    Return strictly a JSON array of objects.
    Each object must have:
    - id: (string, e.g., "slide-1")
    - title: (string)
    - purpose: (string, brief description of what goes on this slide)
    - type: (string, e.g., "Title Slide", "Content & Image", "List", "Quote", "Big Number")
  `;

  const schema: SchemaParams = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            purpose: { type: Type.STRING },
            type: { type: Type.STRING }
        },
        required: ["id", "title", "purpose", "type"]
    }
  };

  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text || "[]";
    return JSON.parse(text) as AIOutlineItem[];
  } catch (e) {
    console.error("Outline generation failed", e);
    throw e;
  }
};

export const generateSlideHtml = async (
    outlineItem: AIOutlineItem, 
    userInstruction: string, 
    currentHtml: string | null,
    styleContext: string
): Promise<string> => {
    
    const isEdit = !!currentHtml;
    
    const prompt = `
        You are an expert web designer creating a single HTML presentation slide.
        
        Context:
        - Slide Title: ${outlineItem.title}
        - Slide Purpose: ${outlineItem.purpose}
        - Visual Style: ${styleContext}
        ${isEdit ? `- Current HTML state provided below.` : ''}
        
        User Instruction: "${userInstruction}"
        
        Requirements:
        1. Return a STANDALONE HTML document (<!DOCTYPE html>...</html>).
        2. Include all CSS in <style> tags in the <head>. Use modern CSS (Flexbox/Grid).
        3. Ensure the body fills 100vh and 100vw, overflow hidden.
        4. Use a font stack that matches the requested style.
        5. Use placeholder images (https://picsum.photos/...) if images are needed.
        6. NO external CSS/JS links.
        
        ${isEdit ? `Current HTML: \n${currentHtml}` : ''}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
        });

        let text = response.text || "";
        const codeBlockMatch = text.match(/```html([\s\S]*?)```/);
        if (codeBlockMatch) {
            text = codeBlockMatch[1].trim();
        } else {
            text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        }
        return text;
    } catch (e) {
        console.error("Slide generation failed", e);
        return currentHtml || "<div>Error generating slide</div>";
    }
};

export const extractDesignPattern = async (slides: string[]): Promise<string> => {
    const prompt = `
        Analyze these 3 HTML slides and extract the "Design System" used.
        Return a concise text summary describing:
        - The color palette (hex codes or descriptions).
        - The typography choices (font families, sizes, weights).
        - Layout patterns (margins, alignment).
        - Decoration styles (shadows, borders, gradients).
        
        This summary will be used to instruct an AI to generate matching slides.
        
        Slide 1: ${slides[0].substring(0, 1000)}...
        Slide 2: ${slides[1].substring(0, 1000)}...
        Slide 3: ${slides[2].substring(0, 1000)}...
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
        });
        return response.text || "Modern minimalist style";
    } catch (e) {
        return "Modern minimalist style";
    }
};

export const generateBulkSlide = async (outlineItem: AIOutlineItem, designPattern: string): Promise<string> => {
    const prompt = `
        Generate a standalone HTML slide for:
        Title: ${outlineItem.title}
        Purpose: ${outlineItem.purpose}
        Type: ${outlineItem.type}
        
        STRICT DESIGN SYSTEM TO FOLLOW:
        ${designPattern}
        
        Requirements:
        1. Output pure HTML document with embedded CSS.
        2. EXACTLY match the colors, fonts, and layout logic described in the design system.
        3. Ensure responsive 100vh/100vw container.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt
        });
        
        let text = response.text || "";
        const codeBlockMatch = text.match(/```html([\s\S]*?)```/);
        if (codeBlockMatch) {
            text = codeBlockMatch[1].trim();
        } else {
            text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        }
        return text;
    } catch (e) {
        console.error("Bulk slide generation failed", e);
        return `<html><body><h1>${outlineItem.title}</h1><p>Generation failed</p></body></html>`;
    }
};
