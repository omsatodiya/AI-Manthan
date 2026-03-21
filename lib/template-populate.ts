export function normalizeLineBreaks(text: string): string {
  return text.replace(/\\n/g, "\n");
}

export function populateTemplate(
  templateContent: string,
  data: Record<string, string>
): string {
  return templateContent.replace(
    /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?([^}]+?)\s*\}\}/g,
    (match, type: string | undefined, key: string) => {
      const dataKey = key.trim();
      const value = data[dataKey] ?? `[${dataKey}]`;
      switch (type) {
        case "points":
          return value
            .split("\n")
            .map((item) => (item.trim() ? `<li>${item.trim()}</li>` : ""))
            .join("");
        case "table": {
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
        }
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
        default:
          return value;
      }
    }
  );
}
