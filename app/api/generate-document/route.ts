import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getTemplateById } from "@/lib/database/templates";
import { getCurrentUserAction } from "@/app/actions/auth";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY_MISSING");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

async function generateWithRetry(prompt: string) {
  const groq = getGroqClient();
  const models = [process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile"];
  const maxAttemptsPerModel = 2;
  let lastError: unknown = null;

  for (const modelName of models) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
      try {
        const result = await groq.chat.completions.create({
          model: modelName,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        });
        const content = result.choices[0]?.message?.content;
        if (!content) {
          throw new Error("GROQ_EMPTY_RESPONSE");
        }
        return content;
      } catch (error) {
        lastError = error;
        const status = (error as { status?: number }).status;
        const statusText =
          ((error as { statusText?: string }).statusText || "").toLowerCase();
        const message =
          ((error as { message?: string }).message || "").toLowerCase();
        const code = ((error as { code?: string }).code || "").toLowerCase();
        const isInvalidKey =
          status === 401 ||
          code.includes("invalid_api_key") ||
          message.includes("invalid api key") ||
          message.includes("incorrect api key");
        if (isInvalidKey) {
          throw new Error("GROQ_API_KEY_INVALID");
        }
        const isRetryable =
          status === 429 ||
          status === 503 ||
          status === 502 ||
          status === 504 ||
          statusText.includes("service unavailable") ||
          message.includes("temporarily unavailable") ||
          message.includes("high demand");
        if (isRetryable && attempt < maxAttemptsPerModel) {
          await sleep(600 * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}

// Function to convert \n characters to actual line breaks
const normalizeLineBreaks = (text: string) => {
  return text.replace(/\\n/g, '\n');
};


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { templateId, userInput } = body;

    if (!templateId || !userInput) {
      return NextResponse.json(
        { error: "Template ID and user input are required" },
        { status: 400 }
      );
    }

    // Get current user to determine tenant
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.tenantId) {
      return NextResponse.json(
        { error: "User not authenticated or no tenant found" },
        { status: 401 }
      );
    }

    // Fetch template from database
    const template = await getTemplateById(currentUser.tenantId, templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Normalize template content first
    const normalizedTemplateContent = normalizeLineBreaks(template.htmlContent);
    
    // Detect field formats from HTML template
    const fieldFormats: Record<string, string> = {};
    const regex =
      /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?([^}]+?)\s*\}\}/g;
    let match;
    while ((match = regex.exec(normalizedTemplateContent)) !== null) {
      fieldFormats[match[2]] = match[1] || "text";
    }
    
    console.log("Detected field formats:", fieldFormats);
    console.log("User input:", userInput);

    // Generate intelligent instructions based on field types and content
    const instructions = template.fields
      .map((field) => {
        const format = fieldFormats[field.key] || "text";
        const fieldKey = field.key.toLowerCase();
        const fieldName = field.name.toLowerCase();
        
        // Determine content strategy based on field name and type
        let contentStrategy = "Generate appropriate content based on the user's notes.";
        let formatInstruction = "";

        // Content strategy based on field name patterns
        if (
          fieldKey.includes("title") ||
          fieldKey.includes("name") ||
          fieldKey.includes("subject") ||
          fieldName.includes("title") ||
          fieldName.includes("name")
        ) {
          contentStrategy =
            "You MUST create a concise, professional title or name (3-8 words max) based on the user's notes.";
        } else if (
          fieldKey.includes("summary") ||
          fieldKey.includes("overview") ||
          fieldKey.includes("executive") ||
          fieldName.includes("summary") ||
          fieldName.includes("overview")
        ) {
          contentStrategy =
            "You MUST create a comprehensive executive summary or overview paragraph (2-4 sentences) that captures the key points from the user's notes.";
        } else if (
          fieldKey.includes("description") ||
          fieldKey.includes("details") ||
          fieldKey.includes("background") ||
          fieldName.includes("description") ||
          fieldName.includes("details")
        ) {
          contentStrategy =
            "You MUST expand the user's notes into a detailed, well-written paragraph that provides comprehensive information.";
        } else if (
          fieldKey.includes("challenge") ||
          fieldKey.includes("problem") ||
          fieldKey.includes("issue") ||
          fieldName.includes("challenge") ||
          fieldName.includes("problem")
        ) {
          contentStrategy =
            "You MUST identify and articulate the main challenges or problems mentioned in the user's notes.";
        } else if (
          fieldKey.includes("solution") ||
          fieldKey.includes("approach") ||
          fieldKey.includes("strategy") ||
          fieldName.includes("solution") ||
          fieldName.includes("approach")
        ) {
          contentStrategy =
            "You MUST develop a clear solution, approach, or strategy based on the user's notes.";
        } else if (
          fieldKey.includes("benefit") ||
          fieldKey.includes("advantage") ||
          fieldKey.includes("value") ||
          fieldName.includes("benefit") ||
          fieldName.includes("advantage")
        ) {
          contentStrategy =
            "You MUST highlight the key benefits, advantages, or value propositions from the user's notes.";
        } else if (
          fieldKey.includes("goal") ||
          fieldKey.includes("objective") ||
          fieldKey.includes("target") ||
          fieldName.includes("goal") ||
          fieldName.includes("objective")
        ) {
          contentStrategy =
            "You MUST define clear goals, objectives, or targets based on the user's notes.";
        } else if (
          fieldKey.includes("timeline") ||
          fieldKey.includes("schedule") ||
          fieldKey.includes("deadline") ||
          fieldName.includes("timeline") ||
          fieldName.includes("schedule")
        ) {
          contentStrategy =
            "You MUST create a realistic timeline or schedule based on the user's notes.";
        } else if (
          fieldKey.includes("budget") ||
          fieldKey.includes("cost") ||
          fieldKey.includes("price") ||
          fieldName.includes("budget") ||
          fieldName.includes("cost")
        ) {
          contentStrategy =
            "You MUST provide budget estimates or cost information based on the user's notes.";
        }

        // Format instructions based on detected format
        switch (format) {
          case "points":
            formatInstruction =
              "The output MUST be a bulleted list format, with each point on a new line (separated by '\\n'). Each point should be concise but informative. Start each point with a dash (-) or bullet point.";
            break;
          case "table":
            formatInstruction =
              "The output MUST be in CSV format, with the first row as headers and subsequent rows as data. Use commas to separate columns. Make sure the table is well-structured and informative.";
            break;
          case "paragraphs":
            formatInstruction =
              "The output MUST be multiple well-structured paragraphs, separated by double newlines ('\\n\\n'). Each paragraph should focus on a specific aspect or topic.";
            break;
          case "heading":
            formatInstruction =
              "The output MUST be a concise, impactful sub-heading (3-6 words) that clearly identifies the section.";
            break;
          case "bold":
            formatInstruction = "The output MUST be a short, emphasized phrase or value that should stand out.";
            break;
          case "italic":
            formatInstruction = "The output MUST be a short phrase or value that should be emphasized in italics.";
            break;
          case "text":
          default:
            formatInstruction = "The output MUST be plain text, well-formatted and easy to read.";
            break;
        }

        return `- For the field "${field.name}" (\`${field.key}\`): ${contentStrategy} ${formatInstruction}`;
      })
      .join("\n");

    const prompt = `You are an expert business document writer. Your task is to populate a "${
      template.title
    }" based on the user's notes. 

IMPORTANT: Your response MUST be a single, valid JSON object where:
- Keys are the exact field keys from the template (e.g., "Company Name", "Description", "Solution")
- Values are the generated content in the specified format for each field
- Do NOT include any markdown formatting, code blocks, or explanations
- Do NOT include any text before or after the JSON object

USER'S NOTES:
${JSON.stringify(userInput, null, 2)}

FIELD INSTRUCTIONS:
${instructions}

TEMPLATE FIELDS TO POPULATE:
${template.fields.map(f => `- "${f.key}" (${f.name})`).join('\n')}

CRITICAL: The JSON object keys MUST match exactly with the field keys above. For example, if a field key is "Company Name", the JSON key must be "Company Name" (with the space).

Remember: Return ONLY the JSON object with the field keys and generated content.`;

    const responseText = await generateWithRetry(prompt);
    
    console.log("AI Response:", responseText);

    let aiData: Record<string, string>;
    try {
      // Clean the response text to extract JSON
      let cleanedJsonString = responseText
        .replace(/```json|```/g, "")
        .replace(/^[^{]*/, "") // Remove any text before the first {
        .replace(/[^}]*$/, "") // Remove any text after the last }
        .trim();
      
      // If we still don't have valid JSON, try to find JSON in the response
      if (!cleanedJsonString.startsWith('{')) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedJsonString = jsonMatch[0];
        }
      }
      
      aiData = JSON.parse(cleanedJsonString);
      
      // Validate that we have data for all required fields
      const missingFields = template.fields.filter(field => !aiData[field.key]);
      if (missingFields.length > 0) {
        console.warn("Missing fields in AI response:", missingFields.map(f => f.key));
        // Fill missing fields with placeholder text
        missingFields.forEach(field => {
          aiData[field.key] = `[${field.name} - Please provide more details]`;
        });
      }
    } catch (e) {
      console.error("Failed to parse Groq JSON response:", responseText);
      console.error("Parse error:", e);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again with more detailed input." },
        { status: 500 }
      );
    }

    console.log("AI Generated Data:", aiData);
    
    return NextResponse.json({ 
      generatedData: aiData,
      templateContent: normalizeLineBreaks(template.htmlContent)
    });
  } catch (error) {
    console.error("API Error:", error);
    const message = error instanceof Error ? error.message : "";
    if (
      message === "GROQ_API_KEY_MISSING" ||
      message === "GROQ_API_KEY_INVALID"
    ) {
      return NextResponse.json(
        {
          error:
            "AI service is not configured correctly. Set a valid GROQ_API_KEY in your environment and redeploy.",
        },
        { status: 502 }
      );
    }
    const status = (error as { status?: number }).status;
    const statusText = (error as { statusText?: string }).statusText || "";
    if (status === 404) {
      return NextResponse.json(
        {
          error:
            "Configured Groq model is unavailable. Set GROQ_MODEL to a supported model.",
        },
        { status: 502 }
      );
    }
    if (status === 429 || status === 503) {
      return NextResponse.json(
        {
          error:
            "AI service is temporarily overloaded. Please try again in a few seconds.",
        },
        { status: 503 }
      );
    }
    if (
      typeof statusText === "string" &&
      statusText.toLowerCase().includes("service unavailable")
    ) {
      return NextResponse.json(
        {
          error:
            "AI service is temporarily unavailable. Please try again shortly.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
