import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Safe JSON parse – throws a clean error instead of crashing with position info
function safeParseJSON(text: string, label: string): any {
  try {
    return JSON.parse(text);
  } catch (err: any) {
    console.error(`[AI] Failed to parse JSON from ${label}:`, err.message);
    console.error(`[AI] Raw response (first 500 chars):`, text?.slice(0, 500));
    throw new Error(`AI returned malformed JSON for ${label}. Try again or simplify your input.`);
  }
}

// ── Shared resume JSON schema ─────────────────────────────────────────────────
const RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    personalInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        linkedin: { type: Type.STRING },
        portfolio: { type: Type.STRING },
      },
    },
    summary: { type: Type.STRING },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          title: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
          description: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          institution: { type: Type.STRING },
          degree: { type: Type.STRING },
          year: { type: Type.STRING },
        },
      },
    },
  },
};

// ── Agent 1: Resume Parser ────────────────────────────────────────────────────
export async function parseResumeToJSON(rawText: string) {
  const prompt = `You are an expert ATS Resume Parser. Extract structured information from the resume text below. 
Do NOT invent information. Return a strict JSON object.

Resume Text:
${rawText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESUME_SCHEMA,
      maxOutputTokens: 8192,
    },
  });

  if (response.text) return safeParseJSON(response.text, 'parseResume');
  return null;
}

// ── Agent 2: JD Analyzer ──────────────────────────────────────────────────────
export async function analyzeJobDescription(jdText: string) {
  const prompt = `You are an expert Recruiter and ATS Analyst. Analyze the Job Description below.
Identify: required skills, preferred skills, ATS keywords, tools/platforms, and the role focus.

Job Description:
${jdText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          jobTitle: { type: Type.STRING },
          company: { type: Type.STRING },
          requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          preferredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          atsKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          toolsAndPlatforms: { type: Type.ARRAY, items: { type: Type.STRING } },
          roleFocus: { type: Type.STRING },
        },
      },
      maxOutputTokens: 4096,
    },
  });

  if (response.text) return safeParseJSON(response.text, 'analyzeJD');
  return null;
}

// ── Agent 3: Optimizer ────────────────────────────────────────────────────────
export async function optimizeResume(parsedResume: any, analyzedJD: any) {
  const prompt = `You are an Expert ATS Resume Optimizer.
Tailor the candidate's resume to better match the Job Description.

RULES (strictly follow):
1. NEVER change: Name, Email, Phone, LinkedIn, Portfolio, Education, Company Names, Job Titles, or Project Titles.
2. You MAY rewrite: Professional Summary, Skills list, and Experience bullet points.
3. Never fabricate skills or experience. Only naturally weave in relevant keywords.
4. Each experience entry must keep the same number of bullet points (do not add or remove bullets).
5. Return the full resume in exactly the same JSON structure as provided.

Candidate Resume:
${JSON.stringify(parsedResume)}

JD Analysis:
${JSON.stringify(analyzedJD)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESUME_SCHEMA,
      maxOutputTokens: 16384,
    },
  });

  if (response.text) return safeParseJSON(response.text, 'optimizeResume');
  return null;
}

// ── Agent 4: ATS Scorer ───────────────────────────────────────────────────────
export async function calculateATSScore(originalResume: any, optimizedResume: any, analyzedJD: any) {
  const slim = (r: any) => ({
    summary: (r?.summary || '').slice(0, 400),
    skills: (r?.skills || []).slice(0, 15),
    bullets: (r?.experience || []).flatMap((e: any) => (e.description || []).slice(0, 2)).slice(0, 10),
  });

  const atsKeywords = (analyzedJD?.atsKeywords || []).slice(0, 15);
  const requiredSkills = (analyzedJD?.requiredSkills || []).slice(0, 10);

  const prompt = `You are an ATS Scoring Engine.
Score the Original and Optimized resumes (0-100) against the JD keywords.
List up to 6 missing keywords (single words or short phrases only).
Write exactly 3 short improvement suggestions (max 10 words each).

Original: ${JSON.stringify(slim(originalResume))}
Optimized: ${JSON.stringify(slim(optimizedResume))}
JD Keywords: ${JSON.stringify(atsKeywords)}
Required Skills: ${JSON.stringify(requiredSkills)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalScore:         { type: Type.INTEGER },
            optimizedScore:        { type: Type.INTEGER },
            keywordMatchPercentage:{ type: Type.INTEGER },
            missingKeywords:       { type: Type.ARRAY, items: { type: Type.STRING }, maxItems: 6 },
            suggestions:           { type: Type.ARRAY, items: { type: Type.STRING }, maxItems: 3 },
          },
          required: ['originalScore', 'optimizedScore', 'keywordMatchPercentage', 'missingKeywords', 'suggestions'],
        },
        maxOutputTokens: 8192,
        temperature: 0,
      },
    });

    if (response.text) return safeParseJSON(response.text, 'atsScore');
    throw new Error('Empty response from AI');
  } catch (err) {
    console.error('[AI] calculateATSScore failed:', (err as Error).message);
    // Graceful fallback — optimized resume is still shown, scores default to 0
    return {
      originalScore: 0,
      optimizedScore: 0,
      keywordMatchPercentage: 0,
      missingKeywords: [],
      suggestions: ['ATS scoring failed — your optimized resume was still generated successfully.'],
    };
  }
}
