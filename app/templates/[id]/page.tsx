"use client";

import { notFound } from "next/navigation";
import React, { useMemo, useRef, useState, use, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Download, Loader2, Sparkles, RotateCcw } from "lucide-react";

import { Template } from "@/constants/templates";
import { useTenant } from "@/contexts/tenant-context";
import { getTemplateAction } from "@/app/actions/templates";
import { Button } from "@/components/ui/button";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toast";

// Function to convert \n characters to actual line breaks
const normalizeLineBreaks = (text: string) => {
  return text.replace(/\\n/g, '\n');
};

function populateTemplate(
  templateContent: string,
  data: Record<string, string>
): string {
  console.log("=== POPULATE TEMPLATE DEBUG ===");
  console.log("Template content preview:", templateContent.substring(0, 300) + "...");
  console.log("Data to populate with:", data);
  
  // Test the regex pattern
  const testMatches = templateContent.match(/\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?([^}]+?)\s*\}\}/g);
  console.log("All template variables found:", testMatches);
  
  const result = templateContent.replace(
    /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?([^}]+?)\s*\}\}/g,
    (match, type, key) => {
      // For typed variables like {{heading:Executive Summary}}, use the key part after the colon
      // For simple variables like {{Company Name}}, use the key directly
      const dataKey = type ? key : key; // Both cases use the same key
      const value = data[dataKey] || `[${dataKey}]`;
      console.log(`Found template variable: "${match}" -> key: "${key}", type: "${type}", dataKey: "${dataKey}", value: "${value}"`);
      switch (type) {
        case "points":
          return value
            .split("\n")
            .map((item) => (item.trim() ? `<li>${item.trim()}</li>` : ""))
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
        default:
          return value;
      }
    }
  );
  
  console.log("Final populated result preview:", result.substring(0, 500) + "...");
  console.log("=== END POPULATE TEMPLATE DEBUG ===");
  return result;
}

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Load template when tenant and params are available
  useEffect(() => {
    const loadTemplate = async () => {
      if (!tenantId || tenantLoading) return;
      
      setIsLoading(true);
      try {
        const result = await getTemplateAction(tenantId, resolvedParams.id);
        if (result.success && result.data) {
          console.log('Loaded template:', result.data);
          setTemplate(result.data);
        } else {
          console.error('Failed to load template:', result.message);
          setTemplate(null);
        }
      } catch (error) {
        console.error('Error loading template:', error);
        setTemplate(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [tenantId, tenantLoading, resolvedParams.id]);

  const initialHtml = useMemo(() => {
    if (!template) return "";
    const defaultData = template.fields.reduce((acc, field) => {
      acc[field.key] = `[${field.name}]`;
      return acc;
    }, {} as Record<string, string>);
    const normalizedContent = normalizeLineBreaks(template.htmlContent);
    const populated = populateTemplate(normalizedContent, defaultData);
    console.log("Initial HTML generated:", populated.substring(0, 200) + "...");
    return populated;
  }, [template]);

  const [generatedHtml, setGeneratedHtml] = useState(initialHtml);

  // Update generatedHtml when template changes
  useEffect(() => {
    setGeneratedHtml(initialHtml);
  }, [initialHtml]);

  const formSchema = useMemo(() => {
    if (!template) return null;
    const schemaShape = template.fields.reduce((acc, field) => {
      acc[field.key] = z
        .string()
        .min(3, { message: "Please provide more detail." });
      return acc;
    }, {} as Record<string, z.ZodString>);
    return z.object(schemaShape);
  }, [template]);

  type FormData = Record<string, string>;

  const form = useForm<FormData>({
    resolver: formSchema ? zodResolver(formSchema) as any : undefined,
    defaultValues: {},
  });

  // Update form default values when template loads
  useEffect(() => {
    if (template && formSchema) {
      const defaultValues = template.fields.reduce(
        (acc, field) => ({ ...acc, [field.key]: "" }),
        {} as Record<string, string>
      );
      form.reset(defaultValues);
    }
  }, [template, formSchema, form]);

  // Show loading state
  if (tenantLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-sans">Loading template...</p>
        </div>
      </div>
    );
  }

  // Show error state if no tenant
  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-sans">No tenant selected. Please select a tenant to view templates.</p>
        </div>
      </div>
    );
  }

  if (!template) {
    notFound();
  }

  const handleGenerate = async (values: FormData) => {
    setIsGenerating(true);
    try {
      console.log("Sending request with:", { templateId: template.id, userInput: values });
      
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, userInput: values }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to generate document.");
      }

      const responseData = await response.json();
      console.log("API Response:", responseData);
      
      const { generatedData, templateContent } = responseData;
      console.log("Generated data:", generatedData);
      console.log("Template content preview:", templateContent.substring(0, 200) + "...");
      console.log("Template fields:", template.fields.map(f => ({ key: f.key, name: f.name })));
      
      // Test with a simple dataset first
      const testData = {
        'Company Name': 'Test Company',
        'Year': '2024',
        'Executive Summary': 'This is a test summary.',
        'Key Leadership': 'CEO: Test CEO\nCTO: Test CTO',
        'Financials Table': 'Month,Profit\nJanuary,100000\nFebruary,120000',
        'Strategic Goals': 'Goal 1: Test goal\nGoal 2: Another test goal'
      };
      
      console.log("Testing with simple data:", testData);
      const testHtml = populateTemplate(templateContent, testData);
      console.log("Test HTML result:", testHtml.substring(0, 300) + "...");
      
      // Use the local populateTemplate function to generate the HTML
      const populatedHtml = populateTemplate(templateContent, generatedData);
      console.log("Setting generated HTML:", populatedHtml.substring(0, 200) + "...");
      
      // Check if any variables were actually replaced
      const hasPlaceholders = populatedHtml.includes('[Company Name]') || populatedHtml.includes('[Year]') || populatedHtml.includes('[Executive Summary]');
      if (hasPlaceholders) {
        console.error("WARNING: Template variables were not replaced! Still showing placeholders.");
        console.log("Available data keys:", Object.keys(generatedData));
        console.log("Template content sample:", templateContent.substring(0, 500));
      }
      
      setGeneratedHtml(populatedHtml);
      setIsAiGenerated(true);

      toast.success("Your document has been generated.");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setGeneratedHtml(initialHtml);
    setIsAiGenerated(false);
    toast.success("The document preview has been reset.");
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current?.contentWindow?.document.body) {
      toast.error("Preview content not available.");
      return;
    }
    setIsDownloading(true);
    try {
      const element = previewRef.current.contentWindow.document.body;
      const dataUrl = await toPng(element, { pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: "p", unit: "px", format: "a4" });
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${template.id}.pdf`);
      toast.success("Your PDF has been downloaded.");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("An error occurred while generating the PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <ResizablePanelGroup
      direction="horizontal"
      className="min-h-[calc(100vh-65px)] w-full">
      <ResizablePanel defaultSize={35} minSize={25}>
        <ScrollArea className="h-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold font-sans">{template.title}</h2>
                <p className="text-muted-foreground font-sans">
                  Fill in the fields to guide the AI.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Reset Preview">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            {template && formSchema && (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleGenerate)}
                  className="space-y-6">
                  {template.fields.map((field) => (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={field.key}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>{field.name}</FormLabel>
                        <FormControl>
                          {field.type === "textarea" ? (
                            <Textarea
                              placeholder={field.placeholder}
                              value={formField.value || ""}
                              onChange={formField.onChange}
                              onBlur={formField.onBlur}
                              name={formField.name}
                              ref={formField.ref}
                              className="min-h-[100px]"
                            />
                          ) : (
                            <Input
                              placeholder={field.placeholder}
                              value={formField.value || ""}
                              onChange={formField.onChange}
                              onBlur={formField.onBlur}
                              name={formField.name}
                              ref={formField.ref}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  ))}
                <div className="flex flex-col gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full">
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate with AI
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={!isAiGenerated || isDownloading}
                    variant="outline"
                    className="w-full">
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download as PDF
                  </Button>
                </div>
                </form>
              </Form>
            )}
          </div>
        </ScrollArea>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65} minSize={30}>
        <div className="h-full w-full bg-muted p-4">
          <iframe
            ref={previewRef}
            srcDoc={generatedHtml}
            title="Template Preview"
            className="h-full w-full rounded-md border border-border bg-white shadow-sm"
            sandbox="allow-same-origin allow-scripts"
            onLoad={() => {
              console.log("Preview iframe loaded with content:", generatedHtml.substring(0, 200) + "...");
            }}
          />
        </div>
      </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster />
    </>
  );
}
