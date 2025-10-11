import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { templates } from "@/constants/templates";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function populateTemplate(
  templateContent: string,
  data: Record<string, string>
): string {
  return templateContent.replace(
    /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?(\w+)\s*\}\}/g,
    (match, type, key) => {
      const value = data[key] || "";
      switch (type) {
        case "points":
          return value
            .split("\n")
            .map((item) =>
              item.trim() ? `<li>${item.trim().replace(/^- /, "")}</li>` : ""
            )
            .join("");
        case "table":
          const rows = value.split("\n").filter((r) => r.trim());
          if (rows.length === 0) return "<table></table>";
          const headers = rows[0]
            .split(",")
            .map((h) => `<th>${h.trim()}</th>`)
            .join("");
          const bodyRows = rows
            .slice(1)
            .map(
              (row) =>
                `<tr>${row
                  .split(",")
                  .map((c) => `<td>${c.trim()}</td>`)
                  .join("")}</tr>`
            )
            .join("");
          return `<table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
        case "paragraphs":
          return value
            .split("\n\n")
            .map((p) => (p.trim() ? `<p>${p.trim()}</p>` : ""))
            .join("");
        case "bold":
          return `<strong>${value}</strong>`;
        case "italic":
          return `<em>${value}</em>`;
        case "heading":
          return `<h3>${value}</h3>`;
        case "text":
        default:
          return value;
      }
    }
  );
}

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

    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const fieldFormats: Record<string, string> = {};
    const regex =
      /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?(\w+)\s*\}\}/g;
    let match;
    while ((match = regex.exec(template.htmlContent)) !== null) {
      fieldFormats[match[2]] = match[1] || "text";
    }

    const instructions = template.fields
      .map((field) => {
        const format = fieldFormats[field.key];
        const fieldKey = field.key.toLowerCase();
        let contentStrategy =
          "Generate appropriate content based on the user's notes.";
        let formatInstruction = "";

        if (
          fieldKey === "projectname" ||
          fieldKey.includes("title") ||
          fieldKey.includes("campaignname")
        ) {
          contentStrategy =
            "You MUST summarize the user's notes for this field into a short, professional title (5-10 words max).";
        } else if (
          fieldKey.includes("summary") ||
          fieldKey.includes("description") ||
          fieldKey.includes("challenge") ||
          fieldKey.includes("solution") ||
          fieldKey.includes("overview")
        ) {
          contentStrategy =
            "You MUST expand on the user's notes for this field to create a comprehensive, well-written paragraph.";
        }

        switch (format) {
          case "points":
            formatInstruction =
              "The output MUST be a bulleted list, with each point on a new line (separated by '\\n').";
            break;
          case "table":
            formatInstruction =
              "The output MUST be in CSV format, with the first row as headers.";
            break;
          case "paragraphs":
            formatInstruction =
              "The output MUST be multiple paragraphs of text, separated by a double newline ('\\n\\n').";
            break;
          case "heading":
            formatInstruction =
              "The output MUST be a concise and impactful sub-heading (3-6 words).";
            break;
          case "bold":
          case "italic":
            formatInstruction = "The output MUST be a short phrase or value.";
            break;
        }

        return `- For the field "${field.name}" (\`${field.key}\`): ${contentStrategy} ${formatInstruction}`;
      })
      .join("\n");

    const prompt = `You are an expert business document writer. Your task is to populate a "${
      template.title
    }" based on the user's notes. Analyze the user's notes and follow the specific instructions for each field to generate the content. Your response MUST be a single, minified JSON object where the keys are the field keys (e.g., "companyName") and the values are the generated content in the specified format.\n\nUSER'S NOTES:\n${JSON.stringify(
      userInput,
      null,
      2
    )}\n\nINSTRUCTIONS FOR EACH FIELD:\n${instructions}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let aiData: Record<string, string>;
    try {
      const cleanedJsonString = responseText.replace(/```json|```/g, "").trim();
      aiData = JSON.parse(cleanedJsonString);
    } catch (e) {
      console.error("Failed to parse Gemini JSON response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    const populatedHtml = populateTemplate(template.htmlContent, aiData);
    return NextResponse.json({ htmlContent: populatedHtml });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred" },
      { status: 500 }
    );
  }
}
