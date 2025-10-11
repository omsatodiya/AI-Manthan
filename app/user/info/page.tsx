"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import { getCurrentUserAction } from "@/app/actions/auth";
import { getUserInfoAction, saveUserInfoAction } from "@/app/actions/user-info";
import { useTenant } from "@/contexts/tenant-context";
import { AuthUser, UserInfo } from "@/lib/types";
import { questions, getTotalQuestions } from "@/constants/user/questions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "@/components/user/question-renderer";

export default function UserInfoPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<{
    role?: string;
    organizationType?: string;
    businessStage?: string;
    teamSize?: string;
    industry?: string[];
    goals?: string[];
    opportunityType?: string[];
    focusAreas?: string[];
    collabTarget?: string[];
    collabType?: string[];
    partnershipOpen?: string;
    templateType?: string[];
    templateTone?: string;
    templateAutomation?: string;
    eventType?: string[];
    eventScale?: string;
    eventFormat?: string[];
  }>({});

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === getTotalQuestions() - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const form = useForm<Record<string, unknown>>({
    defaultValues: {
      role: undefined,
      organizationType: undefined,
      businessStage: undefined,
      teamSize: undefined,
      industry: [],
      goals: [],
      opportunityType: [],
      focusAreas: [],
      collabTarget: [],
      collabType: [],
      partnershipOpen: undefined,
      templateType: [],
      templateTone: undefined,
      templateAutomation: undefined,
      eventType: [],
      eventScale: undefined,
      eventFormat: [],
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentUser, userInfoResult] = await Promise.all([
          getCurrentUserAction(),
          getUserInfoAction(tenantId || undefined),
        ]);

        if (currentUser) {
          setUser(currentUser);
        }

        if (userInfoResult.success && userInfoResult.data) {
          setUserInfo(userInfoResult.data);
          const answers = {
            role: userInfoResult.data.role || undefined,
            organizationType: userInfoResult.data.organizationType || undefined,
            businessStage: userInfoResult.data.businessStage || undefined,
            teamSize: userInfoResult.data.teamSize || undefined,
            industry: userInfoResult.data.industry || [],
            goals: userInfoResult.data.goals || [],
            opportunityType: userInfoResult.data.opportunityType || [],
            focusAreas: userInfoResult.data.focusAreas || [],
            collabTarget: userInfoResult.data.collabTarget || [],
            collabType: userInfoResult.data.collabType || [],
            partnershipOpen: userInfoResult.data.partnershipOpen || undefined,
            templateType: userInfoResult.data.templateType || [],
            templateTone: userInfoResult.data.templateTone || undefined,
            templateAutomation:
              userInfoResult.data.templateAutomation || undefined,
            eventType: userInfoResult.data.eventType || [],
            eventScale: userInfoResult.data.eventScale || undefined,
            eventFormat: userInfoResult.data.eventFormat || [],
          };
          setSavedAnswers(answers);

          setCurrentQuestionIndex(0);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router, tenantId]);

  useEffect(() => {
    if (Object.keys(savedAnswers).length > 0) {
      form.reset({
        role: savedAnswers.role || undefined,
        organizationType: savedAnswers.organizationType || undefined,
        businessStage: savedAnswers.businessStage || undefined,
        teamSize: savedAnswers.teamSize || undefined,
        industry: savedAnswers.industry || [],
        goals: savedAnswers.goals || [],
        opportunityType: savedAnswers.opportunityType || [],
        focusAreas: savedAnswers.focusAreas || [],
        collabTarget: savedAnswers.collabTarget || [],
        collabType: savedAnswers.collabType || [],
        partnershipOpen: savedAnswers.partnershipOpen || undefined,
        templateType: savedAnswers.templateType || [],
        templateTone: savedAnswers.templateTone || undefined,
        templateAutomation: savedAnswers.templateAutomation || undefined,
        eventType: savedAnswers.eventType || [],
        eventScale: savedAnswers.eventScale || undefined,
        eventFormat: savedAnswers.eventFormat || [],
      });
    }
  }, [savedAnswers, form]);

  useEffect(() => {
    if (currentQuestion && Object.keys(savedAnswers).length > 0) {
      const currentValue =
        savedAnswers[currentQuestion.id as keyof typeof savedAnswers];
      if (currentValue !== undefined) {
        form.setValue(currentQuestion.id, currentValue);
      }
    }
  }, [currentQuestionIndex, currentQuestion, savedAnswers, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === currentQuestion?.id) {
      }
    });
    return () => subscription.unsubscribe();
  }, [form, currentQuestion]);

  const handleCancel = () => {
    router.push("/user");
  };

  const handleNext = async (values: Record<string, unknown>) => {
    try {
      currentQuestion.schema.parse(values);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err) => {
          toast.error(err.message);
        });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave: Record<string, unknown> = {};

      if (currentQuestion.id === "role") {
        dataToSave.role = values.role;
      } else if (currentQuestion.id === "organizationType") {
        dataToSave.organizationType = values.organizationType;
      } else if (currentQuestion.id === "businessStage") {
        dataToSave.businessStage = values.businessStage;
      } else if (currentQuestion.id === "teamSize") {
        dataToSave.teamSize = values.teamSize;
      } else if (currentQuestion.id === "industry") {
        dataToSave.industry = values.industry;
      } else if (currentQuestion.id === "goals") {
        dataToSave.goals = values.goals;
      } else if (currentQuestion.id === "opportunityType") {
        dataToSave.opportunityType = values.opportunityType;
      } else if (currentQuestion.id === "focusAreas") {
        dataToSave.focusAreas = values.focusAreas;
      } else if (currentQuestion.id === "collabTarget") {
        dataToSave.collabTarget = values.collabTarget;
      } else if (currentQuestion.id === "collabType") {
        dataToSave.collabType = values.collabType;
      } else if (currentQuestion.id === "partnershipOpen") {
        dataToSave.partnershipOpen = values.partnershipOpen;
      } else if (currentQuestion.id === "templateType") {
        dataToSave.templateType = values.templateType;
      } else if (currentQuestion.id === "templateTone") {
        dataToSave.templateTone = values.templateTone;
      } else if (currentQuestion.id === "templateAutomation") {
        dataToSave.templateAutomation = values.templateAutomation;
      } else if (currentQuestion.id === "eventType") {
        dataToSave.eventType = values.eventType;
      } else if (currentQuestion.id === "eventScale") {
        dataToSave.eventScale = values.eventScale;
      } else if (currentQuestion.id === "eventFormat") {
        dataToSave.eventFormat = values.eventFormat;
      }

      const result = await saveUserInfoAction(
        dataToSave,
        tenantId || undefined
      );

      if (result.success) {
        setSavedAnswers((prev) => ({ ...prev, ...dataToSave }));

        if (isLastQuestion) {
          // Automatically generate embedding when user completes the last question
          try {
            const embeddingResponse = await fetch(
              "/api/users/generate-embedding",
              {
                method: "POST",
              }
            );

            if (embeddingResponse.ok) {
              const embeddingResult = await embeddingResponse.json();
              if (embeddingResult.success) {
                toast.success(
                  `All information saved and embedding generated using ${embeddingResult.embeddingSource} method! You can continue editing or go back to your profile.`
                );
              } else {
                toast.success(
                  "All information saved successfully! You can continue editing or go back to your profile."
                );
              }
            } else {
              toast.success(
                "All information saved successfully! You can continue editing or go back to your profile."
              );
            }
          } catch {
            toast.success(
              "All information saved successfully! You can continue editing or go back to your profile."
            );
          }
        } else {
          toast.success("Answer saved! Moving to next question.");
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      } else {
        toast.error(
          result.message || "Failed to save answer. Please try again."
        );
      }
    } catch {
      toast.error("Failed to save answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4 dark:bg-background">
        <Card className="w-full max-w-md text-center dark:bg-card/60 dark:border-border">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be logged in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg dark:bg-card/60 dark:border-border">
            <CardHeader>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {getTotalQuestions()}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {Math.round(
                      ((currentQuestionIndex + 1) / getTotalQuestions()) * 100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((currentQuestionIndex + 1) / getTotalQuestions()) * 100
                  }
                  className="h-2"
                />
              </div>
              {Object.keys(savedAnswers).length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 You have existing answers saved. You can review and
                    modify them as needed.
                  </p>
                </div>
              )}
              <CardTitle className="text-2xl font-serif">
                {currentQuestion.title}
              </CardTitle>
              <CardDescription>{currentQuestion.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleNext)}
                  className="space-y-6"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Reusable Question Renderer */}
                      <QuestionRenderer
                        question={currentQuestion}
                        control={form.control}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-between">
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Back to Profile
                      </Button>
                      {!isFirstQuestion && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {isLastQuestion ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save & Complete
                            </>
                          ) : (
                            <>
                              <ChevronRight className="mr-2 h-4 w-4" />
                              Save & Next
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
