import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TaskHistory } from "./tasks/TaskHistory";
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile, state } = useSidebar();
  return (
    <>
      <Sidebar {...props}>
        <div className="absolute top-4 -right-10">
          <SidebarTrigger />
        </div>
        <SidebarContent>
          {/* Task History Section */}
          <TaskHistory />
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
      <div
        className={cn(
          "transition-[padding] w-full px-[80px]",
          state === "expanded" ? "pl-[280px]" : "",
          isMobile && "pl-0",
        )}
      >
        {props.children}
      </div>
    </>
  );
}
