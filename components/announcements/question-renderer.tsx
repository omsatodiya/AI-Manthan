"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { announcementQuestions } from "@/constants/announcement/question";

interface QuestionRendererProps {
  responses: Record<string, unknown>;
  onResponseChange: (responses: Record<string, unknown>) => void;
}

export default function QuestionRenderer({ responses, onResponseChange }: QuestionRendererProps) {
  const handleResponseChange = (questionId: string, value: unknown) => {
    const newResponses = { ...responses, [questionId]: value };
    onResponseChange(newResponses);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Opportunity Application Questions</CardTitle>
          <CardDescription>
            Please answer the following questions to help us understand your application better.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {announcementQuestions.map((question) => (
            <div key={question.id} className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">{question.title}</h4>
                <p className="text-sm text-muted-foreground">{question.description}</p>
              </div>
              {renderQuestion({
                id: question.id,
                type: question.type,
                options: question.options as { value: string; label: string; }[]
              })}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
