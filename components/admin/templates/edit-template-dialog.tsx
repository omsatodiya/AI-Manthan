"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, GripVertical, FileText, Code } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateTemplateAction } from "@/app/actions/templates";
import { Template, type TemplateCategoryId } from "@/constants/templates";
import { TEMPLATE_CATEGORIES, isTemplateCategoryId } from "@/constants/templates/categories";
import { normalizeLineBreaks, populateTemplate } from "@/lib/template-populate";

function categoryFromJson(value: unknown): TemplateCategoryId {
  return typeof value === "string" && isTemplateCategoryId(value)
    ? value
    : "general";
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  category: z.enum(["sales-revenue", "finance-leadership", "operations-delivery", "general"]),
  htmlContent: z.string().min(1, "HTML content is required"),
  fields: z.array(z.object({
    key: z.string().min(1, "Field key is required"),
    name: z.string().min(1, "Field name is required"),
    type: z.enum(["input", "textarea"]),
    placeholder: z.string().min(1, "Placeholder is required"),
  })).min(1, "At least one field is required"),
});

type FormData = z.infer<typeof formSchema>;

interface EditTemplateDialogProps {
  template: Template | null;
  onTemplateUpdated: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function EditTemplateDialog({ template, onTemplateUpdated, onOpenChange }: EditTemplateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [fieldsJsonInput, setFieldsJsonInput] = useState("");
  const [fieldsJsonError, setFieldsJsonError] = useState("");
  
  const open = template !== null ? true : false;
  const setOpen = (newOpen: boolean) => {
    if (!newOpen && onOpenChange) {
      onOpenChange(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: template?.title || "",
      description: template?.description || "",
      category: (template?.category ?? "general") as TemplateCategoryId,
      htmlContent: normalizeLineBreaks(template?.htmlContent || ""),
      fields: template?.fields || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const watchHtml = useWatch({ control: form.control, name: "htmlContent" });
  const watchFields = useWatch({ control: form.control, name: "fields" });

  const previewHtml = useMemo(() => {
    const html = normalizeLineBreaks(watchHtml ?? "");
    const fieldList = watchFields ?? [];
    if (!html.trim()) {
      return "<!DOCTYPE html><html><body style=\"font-family:system-ui;padding:24px;color:#64748b\">No HTML content yet.</body></html>";
    }
    const placeholderData = fieldList.reduce(
      (acc, f) => {
        const k = (f?.key ?? "").trim();
        if (!k) return acc;
        const label = (f?.name ?? "").trim() || k;
        acc[k] = `[${label}]`;
        return acc;
      },
      {} as Record<string, string>
    );
    try {
      return populateTemplate(html, placeholderData);
    } catch {
      return html;
    }
  }, [watchHtml, watchFields]);

  // Update form when template changes
  useEffect(() => {
    if (template) {
      form.reset({
        title: template.title,
        description: template.description,
        category: template.category ?? "general",
        htmlContent: normalizeLineBreaks(template.htmlContent),
        fields: template.fields,
      });
    }
  }, [template, form]);

  const parseJsonInput = () => {
    try {
      setJsonError("");
      const parsed = JSON.parse(jsonInput);
      
      // Validate the JSON structure
      if (!parsed.title || !parsed.description || !parsed.htmlContent || !parsed.fields) {
        throw new Error("Missing required fields: title, description, htmlContent, fields");
      }
      
      if (!Array.isArray(parsed.fields)) {
        throw new Error("Fields must be an array");
      }
      
      // Validate each field
      for (const field of parsed.fields) {
        if (!field.key || !field.name || !field.type || !field.placeholder) {
          throw new Error("Each field must have key, name, type, and placeholder");
        }
        if (!["input", "textarea"].includes(field.type)) {
          throw new Error("Field type must be 'input' or 'textarea'");
        }
      }
      
      // Populate the form with parsed data
      form.reset({
        title: parsed.title,
        description: parsed.description,
        category: categoryFromJson(parsed.category),
        htmlContent: normalizeLineBreaks(parsed.htmlContent),
        fields: parsed.fields,
      });
      
      toast.success("JSON parsed successfully");
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON format");
    }
  };

  const parseFieldsJsonInput = () => {
    try {
      setFieldsJsonError("");
      const parsed = JSON.parse(fieldsJsonInput);
      
      // Validate that it's an array
      if (!Array.isArray(parsed)) {
        throw new Error("Fields must be an array");
      }
      
      // Validate each field
      for (const field of parsed) {
        if (!field.key || !field.name || !field.type || !field.placeholder) {
          throw new Error("Each field must have key, name, type, and placeholder");
        }
        if (!["input", "textarea"].includes(field.type)) {
          throw new Error("Field type must be 'input' or 'textarea'");
        }
      }
      
      // Update the form fields
      form.setValue("fields", parsed);
      
      toast.success("Fields JSON parsed successfully");
    } catch (error) {
      setFieldsJsonError(error instanceof Error ? error.message : "Invalid JSON format");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (!template) return;
      
      const result = await updateTemplateAction(template.id, {
        title: data.title,
        description: data.description,
        category: data.category,
        htmlContent: normalizeLineBreaks(data.htmlContent),
        fields: data.fields,
      });

      if (result.success) {
        toast.success("Template updated successfully");
        setOpen(false);
        onTemplateUpdated();
      } else {
        toast.error(result.message || "Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex w-[calc(100vw-2rem)] max-w-7xl flex-col gap-4 overflow-hidden p-6 sm:max-w-7xl max-h-[92vh]">
        <DialogHeader className="shrink-0 space-y-2 text-left">
          <DialogTitle className="font-sans">Edit Template</DialogTitle>
          <DialogDescription className="font-sans">
            Update the template details and content.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted/15 lg:flex-row lg:items-stretch">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto border-b lg:max-w-[52%] lg:border-b-0 lg:border-r lg:p-4">
        <Tabs defaultValue="form" className="flex w-full min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Form
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="space-y-4">
            <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter template description"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter HTML content"
                      className="min-h-[300px] font-mono text-sm"
                      value={normalizeLineBreaks(field.value || "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Fields Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Template Fields</FormLabel>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentFields = form.getValues("fields");
                      const jsonString = JSON.stringify(currentFields, null, 2);
                      setFieldsJsonInput(jsonString);
                      setFieldsJsonError("");
                    }}
                  >
                    <Code className="mr-2 h-4 w-4" />
                    Export to JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ key: "", name: "", type: "input", placeholder: "" })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </div>
              
              {/* Fields JSON Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fields JSON (Optional)</label>
                <p className="text-sm text-muted-foreground">
                  Paste JSON array of fields to bulk import, or export current fields to JSON.
                </p>
                <Textarea
                  placeholder={`[
  {
    "key": "Company Name",
    "name": "Company Name",
    "type": "input",
    "placeholder": "Enter your company name"
  },
  {
    "key": "Description",
    "name": "Description",
    "type": "textarea",
    "placeholder": "Enter description"
  }
]`}
                  value={normalizeLineBreaks(fieldsJsonInput)}
                  onChange={(e) => {
                    setFieldsJsonInput(e.target.value);
                    setFieldsJsonError("");
                  }}
                  className="min-h-[150px] font-mono text-sm"
                />
                {fieldsJsonError && (
                  <p className="text-sm text-destructive">{fieldsJsonError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={parseFieldsJsonInput}
                    disabled={!fieldsJsonInput.trim()}
                  >
                    Parse Fields JSON
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFieldsJsonInput("");
                      setFieldsJsonError("");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2 p-4 border rounded-lg">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`fields.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Key</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fields.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fields.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="input">Input</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fields.${index}.placeholder`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placeholder</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Enter your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            </div>
          </TabsContent>
          
          <TabsContent value="json" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">JSON Template Data</label>
                <p className="text-sm text-muted-foreground mb-2">
                  Paste your template JSON data below. It should include title, description, htmlContent, and fields array.
                </p>
                <Textarea
                  placeholder={`{
  "title": "Business Proposal",
  "description": "A comprehensive business proposal template",
  "htmlContent": "<!DOCTYPE html>...",
  "fields": [
    {
      "key": "Company Name",
      "name": "Company Name",
      "type": "input",
      "placeholder": "Enter your company name"
    }
  ]
}`}
                  value={normalizeLineBreaks(jsonInput)}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError("");
                  }}
                  className="min-h-[300px] font-mono text-sm"
                />
                {jsonError && (
                  <p className="text-sm text-destructive mt-2">{jsonError}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={parseJsonInput}
                  disabled={!jsonInput.trim()}
                >
                  Parse JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const formData = form.getValues();
                    const jsonString = JSON.stringify({
                      title: formData.title,
                      description: formData.description,
                      category: formData.category,
                      htmlContent: formData.htmlContent,
                      fields: formData.fields,
                    }, null, 2);
                    setJsonInput(jsonString);
                    setJsonError("");
                  }}
                >
                  Export to JSON
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
              </div>

              <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden bg-muted/30 lg:min-h-0 lg:max-w-[48%]">
            <div className="shrink-0 border-b bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
              Preview
            </div>
            <iframe
              title="Template preview"
              className="min-h-[min(55vh,420px)] w-full flex-1 border-0 bg-white"
              srcDoc={previewHtml}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
            </div>

            <div className="flex shrink-0 justify-end border-t pt-4">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Saving..." : "Save template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
