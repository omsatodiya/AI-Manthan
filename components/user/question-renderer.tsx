"use client";

import { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Question } from "@/constants/user/questions";

interface QuestionRendererProps {
  question: Question;
  control: Control<Record<string, unknown>>;
}

export function QuestionRenderer({ question, control }: QuestionRendererProps) {
  if (question.type === "radio") {
    return (
      <FormField
        control={control}
        name={question.id}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value as string}
                  className="space-y-3">
                {question.options?.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer"
                    />
                    <label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {option.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (question.type === "checkbox") {
    return (
      <FormField
        control={control}
        name={question.id}
        render={() => (
          <FormItem className="space-y-3">
            <FormControl>
              <div className="grid grid-cols-1 gap-3">
                {question.options?.map((option) => (
                  <FormField
                    key={option.value}
                    control={control}
                    name={question.id}
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={option.value}
                          className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <FormControl>
                            <Checkbox
                              checked={(field.value as string[])?.includes(option.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value as string[] || [];
                                return checked
                                  ? field.onChange([...currentValue, option.value])
                                  : field.onChange(
                                      currentValue.filter(
                                        (value: string) => value !== option.value
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return null;
}