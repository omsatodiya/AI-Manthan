"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { createAnnouncementOpportunityAction } from "@/app/actions/announcement-opportunity";
import { announcementQuestions } from "@/constants/announcement/question";
import { Announcement } from "@/lib/types";
import { toast } from "sonner";

interface OpportunityApplicationFormProps {
  announcement: Announcement;
}

export default function OpportunityApplicationForm({ announcement }: OpportunityApplicationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  const handleResponseChange = (questionId: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createAnnouncementOpportunityAction(
        announcement.title,
        announcement.description || "",
        announcement.link || "",
        responses
      );
      
      if (result.success) {
        toast.success("Application submitted successfully!");
        setIsOpen(false);
        setResponses({});
      } else {
        toast.error(result.error || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: {
    id: string;
    type: string;
    options?: Array<{ value: string; label: string }>;
  }) => {
    const currentValue = responses[question.id];

    switch (question.type) {
      case "radio":
        if (question.id === "portfolioLink") {
          return (
            <div className="space-y-2">
              <Label htmlFor={question.id}>Portfolio Link (Optional)</Label>
              <Input
                id={question.id}
                type="url"
                placeholder="https://example.com"
                value={typeof currentValue === 'string' ? currentValue : ""}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
              />
            </div>
          );
        }
        
        if (question.id === "expectedOutcome") {
          return (
            <div className="space-y-2">
              <Label htmlFor={question.id}>Expected Outcome</Label>
              <Textarea
                id={question.id}
                placeholder="Describe what you hope to achieve..."
                value={typeof currentValue === 'string' ? currentValue : ""}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                rows={3}
              />
            </div>
          );
        }

        return (
          <RadioGroup
            value={typeof currentValue === 'string' ? currentValue : ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option.value}`}
                  checked={Array.isArray(currentValue) ? currentValue.includes(option.value) : false}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(currentValue) ? currentValue : [];
                    if (checked) {
                      handleResponseChange(question.id, [...currentValues, option.value]);
                    } else {
                      handleResponseChange(question.id, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
          <Send className="h-4 w-4" />
          Apply for Opportunity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Opportunity</DialogTitle>
          <DialogDescription>
            Please fill out the application form for: <strong>{announcement.title}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {announcementQuestions.map((question) => (
            <div key={question.id} className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">{question.title}</h4>
                <p className="text-sm text-muted-foreground">{question.description}</p>
              </div>
              {renderQuestion({
                id: question.id,
                type: question.type,
                options: question.options as { value: string; label: string; }[] | undefined
              })}
            </div>
          ))}
          
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
