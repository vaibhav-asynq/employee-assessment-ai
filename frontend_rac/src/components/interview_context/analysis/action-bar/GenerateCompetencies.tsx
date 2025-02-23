import { useInterviewAnalysis } from "@/components/providers/InterviewAnalysisContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdvice,
  getDevelopmentAreas,
  getStrengthEvidences,
} from "@/lib/api";
import { InterviewAnalysis, templatesIds } from "@/lib/types";
import { convertToOrderedAnalysis } from "@/components/providers/utils";

const formSchema = z.object({
  noOfGenerate: z.string({
    required_error: "Please select a number.",
  }),
});
type FormSchema = z.infer<typeof formSchema>;

export function GenerateCompetencies() {
  const router = useRouter();
  const {
    setSelectedPath,
    templates,
    setActiveTemplate,
    addTemplate,
    activeTemplateId,
    setError,
  } = useInterviewAnalysis();
  const [generating, setGenerating] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { noOfGenerate: "4" },
  });

  async function onSubmit(data: FormSchema) {
    setGenerating(true);
    const templateId = templatesIds.coachCompetencies;
    const baseTemplateId = templatesIds.base;
    try {
      const [strengthData, developmentData] = await Promise.all([
        getStrengthEvidences(),
        getDevelopmentAreas(),
      ]);

      const data: InterviewAnalysis = {
        name: "",
        date: new Date().toISOString(),
        strengths: Object.keys(strengthData.leadershipQualities).reduce(
          (acc: Record<string, string>, key: string) => {
            acc[key] = "";
            return acc;
          },
          {},
        ),
        areas_to_target: Object.keys(developmentData.developmentAreas).reduce(
          (acc: Record<string, string>, key: string) => {
            acc[key] = "";
            return acc;
          },
          {},
        ),
        next_steps: [
          { main: "", sub_points: [] },
          { main: "", sub_points: [] },
          { main: "", sub_points: [] },
        ],
      };
      const orderedData = convertToOrderedAnalysis(data);

      if (templates[templateId]) {
        // update data
      } else {
        //create template
        addTemplate(templateId, data);
      }

      console.log({ data, orderedData, strengthData, developmentData });
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setGenerating(false);
    }

    // prev
    // setGenerating(true);
    // const currentSearchParams = new URLSearchParams(window.location.search);
    // currentSearchParams.set("aiCompetencies", data.noOfGenerate.toString());
    // router.push(`/?${currentSearchParams.toString()}`);
    //
    // setSelectedPath("ai-competencies");
    // setGenerating(false);
  }

  return (
    <div className={cn("flex gap-4")}>
      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex gap-1 items-center"
          >
            <FormField
              control={form.control}
              name="noOfGenerate"
              disabled={generating}
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
                        {[4, 5, 6, 7, 8, 9, 10].map((item) => (
                          <SelectItem key={item} value={`${item}`}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* <FormMessage /> */}
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={cn("border-foreground")}
              variant={"outline"}
              size={"sm"}
              disabled={
                generating ||
                form.formState.isSubmitting ||
                form.formState.isLoading
              }
            >
              {generating ||
              form.formState.isSubmitting ||
              form.formState.isLoading ? (
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
