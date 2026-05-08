"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateTenantApplicationDetailsAction } from "@/app/actions/tenant-application";

const formSchema = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters."),
  requestedSlug: z.string()
    .min(3, "Slug must be at least 3 characters.")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens."),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTenantApplicationDialogProps {
  applicationId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: {
    orgName: string;
    requestedSlug: string;
    description: string;
  };
}

export function EditTenantApplicationDialog({
  applicationId,
  isOpen,
  onOpenChange,
  defaultValues,
}: EditTenantApplicationDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgName: defaultValues.orgName,
      requestedSlug: defaultValues.requestedSlug,
      description: defaultValues.description || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      const result = await updateTenantApplicationDetailsAction(applicationId, values);
      if (result.success) {
        toast.success("Application updated successfully");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update application");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Edit Application</DialogTitle>
          <DialogDescription className="font-sans">
            Modify the core details of this community application.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="orgName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Innovators Hub"
                      className="rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary font-sans h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] font-sans" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestedSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Requested URL Slug</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-foreground/30">iq.app/</span>
                      <Input
                        placeholder="slug-name"
                        className="pl-[52px] rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary font-mono text-sm h-11"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] font-sans" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans font-bold text-foreground/70 uppercase tracking-wider text-[10px]">Mission Statement / Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe the purpose of this community..."
                      className="rounded-xl border-border/50 focus:ring-primary/20 focus:border-primary font-sans min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] font-sans" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl font-sans"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-chart-2 text-primary-foreground rounded-xl font-sans font-semibold px-8 flex items-center gap-2"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
