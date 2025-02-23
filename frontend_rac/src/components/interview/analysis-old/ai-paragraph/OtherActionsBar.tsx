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
import { Sparkle, WandSparkles } from "lucide-react";

const formSchema = z.object({
  noOfGenerate: z.string({
    required_error: "Please select a number.",
  }),
});
type FormSchema = z.infer<typeof formSchema>;

function OtherActionsBar() {
  const { setSelectedPath, selectedPath } = useInterviewAnalysis();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { noOfGenerate: "4" },
  });

  function onSubmit(data: FormSchema) {
    console.log(data);

    setSelectedPath("ai-competencies");
  }

  const handleGenrateFullReport = async () => {
    setSelectedPath("ai-competencies");
  };

  return (
    <div className={cn("flex gap-4")}>
      <Button
        className={cn("border-foreground")}
        variant={"default"}
        size={"sm"}
        onClick={(e) => {
          e.preventDefault();
          handleGenrateFullReport();
        }}
      >
        <div className="flex items-center gap-2">
          <WandSparkles size={18} />
          <span>Generate full report</span>
        </div>
      </Button>

      <div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
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
                        <SelectTrigger className="w-[170px]">
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
            >
              <div className="flex items-center gap-2">
                <Sparkle size={18} />
                <span>Generate competencies with AI</span>
              </div>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default OtherActionsBar;
