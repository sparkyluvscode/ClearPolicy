import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface SummaryRequest {
  title: string;
  content: string; // Can be impact clause, abstract, latest action, etc.
  subjects?: string[];
  identifier?: string;
  type: "bill" | "proposition";
  year?: string;
}

export interface LevelContent {
  tldr: string;
  whatItDoes: string;
  whoAffected: string;
  pros: string[];
  cons: string[];
}

export interface GeneratedSummary {
  levels: {
    "5": LevelContent;
    "8": LevelContent;
    "12": LevelContent;
  };
  year?: string; // Verified election year if found
}

/**
 * Uses AI to generate a comprehensive summary of a bill or proposition
 * from raw data. This replaces hardcoded databases with dynamic analysis.
 */
export async function generateSummary(req: SummaryRequest): Promise<GeneratedSummary> {
  const client = getOpenAI();
  if (!client) {
    // Fallback if no API key
    return generateFallbackSummary(req);
  }

  // Check if we should even try AI (if content is too minimal, just use fallback)
  if (!req.content || req.content.length < 20) {
    return generateFallbackSummary(req);
  }

  try {
    const prompt = buildPrompt(req);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Fast, capable, and cost-effective
      messages: [
        {
          role: "system",
          content: "You are a non-partisan civic education assistant. Your job is to analyze legislation and ballot measures and provide clear, neutral summaries that help voters understand what they're voting on. Always be factual, neutral, and focus on what the measure actually does rather than taking sides. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent/factual output
    });

    const content = completion.choices[0].message.content;

    if (!content) {
      return generateFallbackSummary(req);
    }

    return parseAIResponse(content, req);
  } catch (error: any) {
    console.error("AI summary generation failed:", error);
    // Handle quota/rate limit errors
    if (error?.message?.includes("quota") || error?.message?.includes("429") || error?.message?.includes("rate limit")) {
      console.warn("OpenAI API quota exceeded. Using fallback summary.");
    }
    // If it's an API key error, log it clearly
    if (error?.message?.includes("API key") || error?.message?.includes("credentials")) {
      console.warn("OpenAI API key may be invalid or missing. Using fallback summary.");
    }
    return generateFallbackSummary(req);
  }
}

function buildPrompt(req: SummaryRequest): string {
  const { title, content, subjects, identifier, type, year } = req;

  return `Analyze this ${type === "proposition" ? "ballot measure" : "bill"} and provide 3 distinct summaries adapted for different reading levels: 5th grade, 8th grade (standard), and 12th grade (detailed).

${type === "proposition" ? "Proposition" : "Bill"}: ${identifier || title}
Title: ${title}
${year ? `Election Year/Context: ${year}\nCRITICAL INSTRUCTION: You MUST properly identify the proposition from THIS specific year (${year}). Do not confuse it with same-numbered propositions from other years.` : ""}
${subjects && subjects.length > 0 ? `Subjects/Topics: ${subjects.join(", ")}\n` : ""}
Content/Description: ${content}

Based on the information above, provide a JSON response with this exact structure:
{
  "levels": {
    "5": {
      "tldr": "Extremely simple 1-2 sentences. Use short words and analogies. Explain like I'm 10.",
      "whatItDoes": "What changes simply? Use basic verbs (stops, allows, pays for).",
      "whoAffected": "Simple groups (e.g. 'students', 'families').",
      "pros": ["Simple good thing 1", "Simple good thing 2", "Simple good thing 3"],
      "cons": ["Simple bad thing 1", "Simple bad thing 2", "Simple bad thing 3"]
    },
    "8": {
      "tldr": "Standard newspaper level summary (1-2 sentences). Clear and direct.",
      "whatItDoes": "Detailed explanation using standard language. Explain requirements.",
      "whoAffected": "Specific groups (e.g. 'California voters', 'small business owners').",
      "pros": ["Standard argument 1", "Standard argument 2", "Standard argument 3"],
      "cons": ["Standard argument 1", "Standard argument 2", "Standard argument 3"]
    },
    "12": {
      "tldr": "Sophisticated policy summary. Use precise terminology.",
      "whatItDoes": "Comprehensive explanation of mechanisms, funding sources, and legal effects.",
      "whoAffected": "Detailed stakeholders including specific agencies or economic sectors.",
      "pros": ["Nuanced policy argument 1", "Nuanced policy argument 2", "Nuanced policy argument 3"],
      "cons": ["Nuanced policy argument 1", "Nuanced policy argument 2", "Nuanced policy argument 3"]
    }
  },
  "year": "The election year this proposition appeared on the ballot (e.g. '2016', '2024')."
}

CRITICAL REQUIREMENTS:
- 5th Grade: NO big words. Short sentences. Use analogies (e.g. 'like a piggy bank').
- 8th Grade: Balance detail and clarity. Avoid jargon.
- 12th Grade: High precision. Use terms like 'appropriation', 'bond measure', 'statutory definition'.
- Be SPECIFIC and CONCRETE at all levels.
- If election year is missing, infer it.`;
}

function parseAIResponse(content: string, req: SummaryRequest): GeneratedSummary {
  try {
    const parsed = JSON.parse(content);
    // Validate structure exists
    if (!parsed.levels || !parsed.levels["5"] || !parsed.levels["8"] || !parsed.levels["12"]) {
      throw new Error("Missing levels");
    }
    return {
      levels: {
        "5": {
          tldr: parsed.levels["5"].tldr || "",
          whatItDoes: parsed.levels["5"].whatItDoes || "",
          whoAffected: parsed.levels["5"].whoAffected || "",
          pros: Array.isArray(parsed.levels["5"].pros) ? parsed.levels["5"].pros : [],
          cons: Array.isArray(parsed.levels["5"].cons) ? parsed.levels["5"].cons : []
        },
        "8": {
          tldr: parsed.levels["8"].tldr || "",
          whatItDoes: parsed.levels["8"].whatItDoes || "",
          whoAffected: parsed.levels["8"].whoAffected || "",
          pros: Array.isArray(parsed.levels["8"].pros) ? parsed.levels["8"].pros : [],
          cons: Array.isArray(parsed.levels["8"].cons) ? parsed.levels["8"].cons : []
        },
        "12": {
          tldr: parsed.levels["12"].tldr || "",
          whatItDoes: parsed.levels["12"].whatItDoes || "",
          whoAffected: parsed.levels["12"].whoAffected || "",
          pros: Array.isArray(parsed.levels["12"].pros) ? parsed.levels["12"].pros : [],
          cons: Array.isArray(parsed.levels["12"].cons) ? parsed.levels["12"].cons : []
        }
      },
      year: parsed.year || req.year
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    // Try to extract JSON if it was wrapped in markdown
    if (content.includes("```json")) {
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (!parsed.levels) throw new Error("Missing levels");
          return {
            levels: {
              "5": parsed.levels["5"],
              "8": parsed.levels["8"],
              "12": parsed.levels["12"]
            },
            year: parsed.year || req.year
          };
        } catch (e) { }
      }
    }
  }

  // Fallback if parsing fails
  return generateFallbackSummary(req);
}

function generateFallbackSummary(req: SummaryRequest): GeneratedSummary {
  const { title, content, subjects, identifier } = req;

  // Initialize pros/cons arrays
  const pros: string[] = [];
  const cons: string[] = [];

  // Extract meaningful content for TL;DR
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  let tldr = "";

  // Try to build a meaningful TL;DR from available content
  if (sentences.length > 0) {
    tldr = sentences.slice(0, 2).join(". ").trim();
  }

  if (!tldr || tldr.length < 30) {
    // Try to build a better summary from available content
    if (content && content.length > 30) {
      // Extract meaningful sentences
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      if (sentences.length > 0) {
        tldr = sentences.slice(0, 2).join(". ").trim();
      }
    }

    // If still no good tldr, use title or create informative message
    if (!tldr || tldr.length < 30) {
      if (title && title.length > 20 && !title.includes("Proposition") && !title.includes("ballot measure")) {
        tldr = title;
      } else if (subjects && subjects.length > 0) {
        tldr = `${identifier || "This measure"} addresses ${subjects.slice(0, 2).join(" and ")}.`;
      } else {
        tldr = `${identifier || "This measure"} addresses policy changes. See official sources for detailed information.`;
      }
    }
  }

  // Build "what it does" from content
  const whatItDoes = content.length > 50
    ? content.split(/[.!?]+/).slice(0, 2).join(". ").trim() || tldr
    : tldr || title;

  // Infer who is affected from subjects and content
  let whoAffected = "See official sources for details.";
  if (subjects && subjects.length > 0) {
    whoAffected = `It affects ${subjects.slice(0, 3).join(", ")}.`;
  } else {
    const lowerContent = (content + " " + title).toLowerCase();
    const affected: string[] = [];
    if (/worker|employee|contractor|labor/.test(lowerContent)) affected.push("workers and employers");
    if (/voter|election|ballot/.test(lowerContent)) affected.push("voters and election officials");
    if (/tax|revenue|budget/.test(lowerContent)) affected.push("taxpayers and government agencies");
    if (/health|medical/.test(lowerContent)) affected.push("patients and healthcare providers");
    if (/education|school/.test(lowerContent)) affected.push("students, teachers, and schools");
    if (/environment|climate/.test(lowerContent)) affected.push("businesses and environmental agencies");
    if (affected.length > 0) {
      whoAffected = `It affects ${affected.join(", ")}.`;
    }
  }

  const summary: LevelContent = {
    tldr: tldr.slice(0, 280),
    whatItDoes: whatItDoes.slice(0, 300),
    whoAffected,
    pros: pros.slice(0, 3),
    cons: cons.slice(0, 3),
  };

  return {
    levels: {
      "5": summary,
      "8": summary,
      "12": summary
    }
  };
}

