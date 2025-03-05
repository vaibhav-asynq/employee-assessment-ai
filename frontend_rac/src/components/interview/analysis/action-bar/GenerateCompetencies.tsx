import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { v4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Sparkle } from "lucide-react";
import {
  getAdvice,
  getDevelopmentAreas,
  getStrengthEvidences,
} from "@/lib/api";
import { useAnalysisStore } from "@/zustand/store/analysisStore";
import { TemplatedData, templatesIds, AreasToTarget, Strengths } from "@/lib/types/types.analysis";
import { useUserPreferencesStore } from "@/zustand/store/userPreferencesStore";
import { ANALYSIS_TAB_NAMES } from "@/lib/constants";
import {
  convertAdviceToOrderedAdvice,
} from "@/lib/utils/analysisUtils";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { EvidenceOfFeedback, CompetenciesAlignment } from "@/lib/types/types.interview-data";

const formSchema = z.object({
  noOfGenerate: z.string({
    required_error: "Please select a number.",
  }),
});
type FormSchema = z.infer<typeof formSchema>;

export function GenerateCompetencies() {
  const fileId = useInterviewDataStore((state) => state.fileId);
  const templates = useAnalysisStore((state) => state.templates);
  const addTemplate = useAnalysisStore((state) => state.addTemplate);
  const handleAnalysisUpdate = useAnalysisStore((state) => state.handleAnalysisUpdate);
  const addTab = useUserPreferencesStore((state) => state.addPath);
  const selectTab = useUserPreferencesStore((state) => state.setSelectedPath);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { noOfGenerate: "3" },
  });

  async function onSubmit(data: FormSchema) {
    if (!fileId) return;
    try {
      const templateId = templatesIds.aiCompetencies;

      const numCompetencies = parseInt(data.noOfGenerate);
      const [strengthData, developmentData, adviceData] = await Promise.all([
        getStrengthEvidences(fileId, numCompetencies),
        getDevelopmentAreas(fileId, numCompetencies),
        getAdvice(fileId),
      ]);

      const orderedAdviceData = convertAdviceToOrderedAdvice(adviceData);
      
      // Create areas to target with proper typing
      const areasToTarget: AreasToTarget = {
        order: Object.keys(developmentData.developmentAreas),
        items: Object.entries(developmentData.developmentAreas).reduce(
          (acc, [heading, { evidence, competencyAlignment }]) => {
            acc[heading] = {
              id: v4(), // Generate unique ID for each item
              heading,
              content: "", // Initialize with empty content
              evidence, // This is already EvidenceOfFeedback[]
              competencyAlignment, // This is already CompetenciesAlignment
            };
            return acc;
          },
          {} as Record<string, {
            id: string;
            heading: string;
            content: string;
            evidence: EvidenceOfFeedback[];
            competencyAlignment: CompetenciesAlignment;
          }>,
        ),
      };
      
      // Create strengths with proper typing
      const strengths: Strengths = {
        order: Object.keys(strengthData.leadershipQualities),
        items: Object.entries(strengthData.leadershipQualities).reduce(
          (acc, [heading, { evidence }]) => {
            acc[heading] = {
              id: v4(), // Generate unique ID for each item
              heading,
              content: "", // Initialize with empty content
              evidence, // This is already EvidenceOfFeedback[]
            };
            return acc;
          },
          {} as Record<string, {
            id: string;
            heading: string;
            content: string;
            evidence: EvidenceOfFeedback[];
          }>,
        ),
      };
      
      const templatedData: TemplatedData = {
        name: "",
        date: new Date().toISOString(),
        strengths,
        areas_to_target: areasToTarget,
        next_steps: [
          { main: "", sub_points: ["", "", ""] },  // First point with 3 sub-points
          "",                                      // Text box
          { main: "", sub_points: ["", "", ""] },  // Second point with 3 sub-points
          { main: "", sub_points: ["", "", ""] },  // Third point with 3 sub-points
          { main: "", sub_points: ["", "", ""] },  // Fourth point with 3 sub-points
        ],
        advices: orderedAdviceData,
      };

      if (templates[templateId]) {
        handleAnalysisUpdate(() => templatedData);
      } else {
        addTemplate(templateId, templatedData, false);
      }
      addTab("ai-competencies", ANALYSIS_TAB_NAMES.aiCompetencies);
      selectTab("ai-competencies");
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }

  return (
    <div className={cn("flex gap-4")}>
      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              await onSubmit(data);
            })}
            className="flex gap-1 items-center"
          >
            <FormField
              control={form.control}
              name="noOfGenerate"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <div className="mr-1">
                      <FormLabel>No of competencies:</FormLabel>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-[60px]">
                          <SelectValue placeholder="no of competencies" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[3,4, 5, 6, 7, 8, 9, 10].map((item) => (
                          <SelectItem key={item} value={`${item}`}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={cn("border-foreground")}
              variant={"outline"}
              size={"sm"}
              disabled={form.formState.isSubmitting || form.formState.isLoading}
            >
              {form.formState.isSubmitting || form.formState.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Generating competencies...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkle size={18} />
                  <span>Generate competencies with AI</span>
                </div>
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
