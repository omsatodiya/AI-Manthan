export interface TemplateField {
  key: string;
  name: string;
  type: "input" | "textarea";
  placeholder: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  htmlContent: string;
  fields: TemplateField[];
  created_at: string;
}
