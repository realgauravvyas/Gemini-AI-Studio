import { GoogleGenAI, Type } from "@google/genai";
import { GradingResult, QuestionContext } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 2000,
  backoffFactor: 2
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a Gemini API operation with retry logic for handling quota/rate limits.
 */
async function withRetry<T>(operation: () => Promise<T>, description: string): Promise<T> {
  let lastError: any;
  let currentDelay = RETRY_CONFIG.initialDelay;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check for errors that are worth retrying
      // 429: Too Many Requests (Quota)
      // 503: Service Unavailable
      // 500: Internal Server Error
      const status = error.status || error.response?.status;
      const message = error.message || '';
      const isQuota = status === 429 || message.includes('429') || message.toLowerCase().includes('quota');
      const isServer = status >= 500 || message.includes('500') || message.includes('503') || message.includes('overloaded');

      if (attempt < RETRY_CONFIG.maxRetries && (isQuota || isServer)) {
        console.warn(`Gemini API Error (Attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}) for ${description}: ${message}. Retrying in ${currentDelay}ms...`);
        await delay(currentDelay);
        currentDelay *= RETRY_CONFIG.backoffFactor;
        continue;
      }
      
      // If strictly not retriable or max retries reached, stop
      break;
    }
  }

  // Enhance error message for the user if it persists
  const status = lastError?.status || lastError?.response?.status;
  const message = lastError?.message || 'Unknown error';
  
  if (status === 429 || message.toLowerCase().includes('quota')) {
    throw new Error(`Usage limit exceeded for ${description}. Please wait a moment before trying again.`);
  }
  
  console.error(`Final Error in ${description}:`, lastError);
  throw new Error(`Failed to ${description}: ${message}`);
}

/**
 * Smartly formats mixed English and Math text into proper LaTeX.
 * e.g., "integral of x^2 from 0 to infty" -> "integral of $x^2$ from $0$ to $\infty$"
 */
export const refineTextToLatex = async (text: string): Promise<string> => {
  if (!text.trim()) return "";
  
  return withRetry(async () => {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      You are a LaTeX formatting assistant.
      
      Task: Convert mathematical parts of the text to LaTeX wrapped in $...$.
      
      Examples:
      Input: "Solve x^2 + 4 = 0 for x"
      Output: "Solve $x^2 + 4 = 0$ for $x$"

      Input: "integral from 0 to infinity of e^-x"
      Output: "$\\int_{0}^{\\infty} e^{-x}$"

      Input: "Find eigenvalues of matrix [[1,2],[3,4]]"
      Output: "Find eigenvalues of matrix $\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$"

      Rules:
      1. Detect math and wrap in single dollar signs $.
      2. Convert English math terms (infty, integral, sum) to Latex syntax (\\infty, \\int, \\sum).
      3. Keep structure and other words exactly the same.
      4. RETURN ONLY THE TEXT. NO PREAMBLE.

      Input Text:
      "${text}"
    `;
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text?.trim() || text;
  }, "refine text to LaTeX");
};

/**
 * Converts an image or PDF (base64) containing handwritten text to a full LaTeX source file.
 */
export const convertImageToLatex = async (base64Data: string, mimeType: string): Promise<string> => {
  return withRetry(async () => {
    const modelId = "gemini-2.5-flash"; // Efficient multimodal model
    const prompt = `
      Analyze the handwritten mathematical text or equations in this file.
      Transcribe it accurately into a COMPLETE, compilable LaTeX document.
      
      Requirements:
      1. Start with \\documentclass[12pt,a4paper]{article}.
      2. Include common packages: amsmath, amssymb, amsfonts, geometry, graphicx.
      3. Set geometry to margin=1in.
      4. Ensure the document is formatted nicely.
      5. Transcribe the handwriting inside the \\begin{document} ... \\end{document} block.
      6. Return ONLY the raw LaTeX code. Do not wrap in markdown blocks.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return response.text?.trim() || "";
  }, "transcribe file to LaTeX");
};

/**
 * Extracts question details from an image or PDF (Question paper, screenshot, etc).
 */
export const extractQuestionFromImage = async (base64Data: string, mimeType: string): Promise<QuestionContext> => {
  return withRetry(async () => {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      Analyze this file (homework question or exam problem).
      Extract the following details:
      1. A short, concise Title.
      2. The full text Description of the problem.
      3. The Total Marks available (if not specified, estimate based on complexity or default to 10).
      
      Return as JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
           { inlineData: { mimeType, data: base64Data } },
           { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            totalMarks: { type: Type.NUMBER }
          },
          required: ["title", "description", "totalMarks"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: crypto.randomUUID(),
        ...data
      };
    }
    throw new Error("No data returned");
  }, "extract question details");
};

/**
 * Transcribes a solution image or PDF into text/LaTeX for use as an answer key.
 */
export const transcribeSolutionImage = async (base64Data: string, mimeType: string): Promise<string> => {
  return withRetry(async () => {
    const modelId = "gemini-2.5-flash";
    const prompt = `
      Analyze the text in this file, which represents a solution to a problem.
      Transcribe it accurately.
      If it contains mathematical equations, represent them in LaTeX format (e.g., $x^2$).
      Return ONLY the transcribed text.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return response.text?.trim() || "";
  }, "transcribe solution key");
};

/**
 * Grades the provided LaTeX source against a question context.
 */
export const gradeLatexSubmission = async (
  latexSource: string,
  context: QuestionContext
): Promise<GradingResult> => {
  return withRetry(async () => {
    const modelId = "gemini-2.5-flash"; // Fast thinking for grading

    const systemInstruction = `
      You are an expert academic grader with a strict eye for LaTeX formatting.
      
      **CRITICAL FORMATTING RULES (FAILURE TO FOLLOW = INCORRECT RESPONSE):**
      1. EVERY mathematical expression, number referring to a value, variable, or equation MUST be wrapped in single dollar signs ($).
      2. NEVER output raw math like "2x^2 + 4 = 0" or "x_1=3". It MUST be "$2x^2 + 4 = 0$" and "$x_1=3$".
      3. Even simple assignments like "a=2" MUST be "$a=2$".
      4. Do not wrap English words in dollar signs. Only math.
      
      **CORRECT Examples:**
      - "The equation $2x^2 - 4x - 6 = 0$ is correct."
      - "You found roots $x_1 = 3$ and $x_2 = -1$."
      - "The coefficients $a=2$, $b=-4$, $c=-6$ are valid."
      - "The calculation $\\sqrt{64}=8$ is right."

      **INCORRECT Examples:**
      - "The equation 2x^2 - 4x - 6 = 0 is correct."
      - "You found roots x_1 = 3 and x_2 = -1."
      - "The coefficients a=2, b=-4, c=-6 are valid."
    `;

    const promptText = `
      Task: Grade the following student submission (in LaTeX format) based on the provided Question Context.
      
      Question Title: ${context.title}
      Question Description: ${context.description}
      ${context.idealSolution ? `Ideal Solution / Answer Key: ${context.idealSolution}` : ''}
      Total Marks Available: ${context.totalMarks}

      Student Submission (LaTeX Source):
      ${latexSource}

      Grading Guidelines:
      1. **Evaluation**:
         - Analyze mathematical correctness and logical flow.
         - Award PARTIAL CREDIT for correct logic, formulas, or transformations.
         - If a Question Paper image is provided, refer to it for diagrams or specific constraints.
         
      2. **Feedback Style**:
         - Be concise, neutral, and encouraging.
         - Reference specific equations or steps from the student's work.
      
      3. **Mistake Classification**:
         - Classify mistakes into categories: 'Conceptual Error', 'Calculation Error', 'Algebraic Error', 'Notation/Formatting', 'Missing Step'.
         - Return the top 1-3 mistake types found.

      4. **Confidence**:
         - Provide a grading confidence score (0.0 to 1.0).

      Return the response in JSON format matching the schema.
    `;

    const contentParts: any[] = [];
    
    // Add question image if available for multimodal context (important for geometry etc)
    if (context.questionImage) {
        contentParts.push({
            inlineData: {
                mimeType: context.questionImage.mimeType,
                data: context.questionImage.data
            }
        });
        contentParts.push({ text: "Reference the above Question Paper for diagrams/context if needed." });
    }

    contentParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contentParts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "The score awarded to the student." },
            maxScore: { type: Type.NUMBER, description: "The total marks available for this question." },
            summary: { type: Type.STRING, description: "A concise summary of the analysis. REMEMBER: Wrap ALL math in $." },
            feedback: { type: Type.STRING, description: "Detailed feedback. REMEMBER: Wrap ALL math in $." },
            mistakes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific errors. REMEMBER: Wrap ALL math in $."
            },
            mistakeTypes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Categories of mistakes found."
            },
            gradingConfidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
            improvements: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of actionable suggestions. REMEMBER: Wrap ALL math in $." 
            },
          },
          required: ["score", "maxScore", "summary", "feedback", "mistakes", "mistakeTypes", "gradingConfidence", "improvements"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GradingResult;
    }
    throw new Error("Empty response from grading model");

  }, "grade submission");
};