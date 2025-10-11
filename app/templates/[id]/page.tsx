"use client";

import { notFound } from "next/navigation";
import React, { useMemo, useRef, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { Download, Loader2, Sparkles, RotateCcw } from "lucide-react";

import { templates } from "@/constants/templates";
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

function populateTemplate(
  templateContent: string,
  data: Record<string, string>
): string {
  return templateContent.replace(
    /\{\{\s*(?:(text|points|table|paragraphs|bold|italic|heading):)?(\w+)\s*\}\}/g,
    (match, type, key) => {
      const value = data[key] || `[${key}]`;
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
}

export default function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const template = useMemo(
    () => templates.find((t) => t.id === resolvedParams.id),
    [resolvedParams.id]
  );

  const initialHtml = useMemo(() => {
    if (!template) return "";
    const defaultData = template.fields.reduce((acc, field) => {
      acc[field.key] = `[${field.name}]`;
      return acc;
    }, {} as Record<string, string>);
    return populateTemplate(template.htmlContent, defaultData);
  }, [template]);

  const [generatedHtml, setGeneratedHtml] = useState(initialHtml);

  const formSchema = useMemo(() => {
    if (!template) return z.object({});
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
    resolver: zodResolver(formSchema) as any,
    defaultValues: template?.fields.reduce(
      (acc, field) => ({ ...acc, [field.key]: "" }),
      {} as Record<string, string>
    ) || {},
  });

  if (!template) {
    notFound();
  }

  const handleGenerate = async (values: FormData) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, userInput: values }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate document.");
      }

      const { htmlContent } = await response.json();
      setGeneratedHtml(htmlContent);
      setIsAiGenerated(true);

      toast.success("Your document has been generated.");
    } catch (error: any) {
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
                <h2 className="text-2xl font-bold">{template.title}</h2>
                <p className="text-muted-foreground">
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
                              {...formField}
                              className="min-h-[100px]"
                            />
                          ) : (
                            <Input
                              placeholder={field.placeholder}
                              {...formField}
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
            sandbox="allow-same-origin"
          />
        </div>
      </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster />
    </>
  );
}
