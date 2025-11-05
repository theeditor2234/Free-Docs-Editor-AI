import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const removeImageBackground = async (file: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const textPart = {
      text: 'Remove the background from this image, making it completely transparent. The main subject, which is likely a signature or a stamp, should be preserved with clean edges. Return only the resulting image.',
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        // The response is a base64 string, so we return it directly.
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data in Gemini API response.");

  } catch (error) {
    console.error("Error removing image background:", error);
    throw new Error("Could not make the image transparent. Please try another image.");
  }
};


export const getCompressionExplanation = async (
  fileType: string,
  compressionLevel: string
): Promise<string> => {
  try {
    const prompt = `Explain in a simple, user-friendly way what happens when a ${fileType} file is compressed at a '${compressionLevel}' level. Focus on the trade-offs between file size and quality. Format the response in Markdown.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating compression explanation:", error);
    return "Could not generate explanation. Please try again.";
  }
};

export const getSuggestedFileName = async (file: File): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: "Based on the content of this image, suggest a concise, descriptive, SEO-friendly filename. Exclude the file extension. Use hyphens instead of spaces." };
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim().replace(/\s+/g, '-');
  } catch (error) {
    console.error("Error generating file name suggestion:", error);
    return "Could not generate name suggestion.";
  }
};

export const extractTableDataAsCsv = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = { text: "Analyze the image of this document page. Extract any tabular data present and format it strictly as CSV (Comma Separated Values). Each row of the table should be a new line, and columns should be separated by commas. Do not include any explanatory text, just the raw CSV data. If no table is found, return the message 'No table data found on this page.'." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error extracting table data:", error);
        return "Error: Could not process the document page. The content might be too complex or unreadable.";
    }
};

export const extractTextFromImage = async (file: File, language: string): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        const textPart = { text: `Perform OCR on this image. The language of the text is ${language}. Extract all text content as accurately as possible. Preserve original line breaks and formatting. If no text is found, return the message 'No text found in the image.'` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error extracting text from image:", error);
        return "Error: Could not process the image. The content might be too complex or unreadable.";
    }
};

export const extractTextFromPdfPageAsMarkdown = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const textPart = { text: "Perform OCR on this document image. Extract all text content. Preserve the original structure and formatting, including headings, paragraphs, lists, and tables, by converting it to Markdown. Respond only with the Markdown content. If no text is found, return the message 'No text content found on this page.'." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error extracting structured text:", error);
        return "Error: Could not process the document page. The content might be too complex or unreadable.";
    }
};
