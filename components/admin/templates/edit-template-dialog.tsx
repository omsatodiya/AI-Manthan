"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Edit, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { updateTemplateAction } from "@/app/actions/templates";
import { Template } from "@/constants/templates";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
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
  template: Template;
  onTemplateUpdated: () => void;
}

export function EditTemplateDialog({ template, onTemplateUpdated }: EditTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: template.title,
      description: template.description,
      htmlContent: template.htmlContent,
      fields: template.fields,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  // Update form when template changes
  useEffect(() => {
    form.reset({
      title: template.title,
      description: template.description,
      htmlContent: template.htmlContent,
      fields: template.fields,
    });
  }, [template, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const result = await updateTemplateAction(template.id, {
        title: data.title,
        description: data.description,
        htmlContent: data.htmlContent,
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
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update the template details and content.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="htmlContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter HTML content"
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
