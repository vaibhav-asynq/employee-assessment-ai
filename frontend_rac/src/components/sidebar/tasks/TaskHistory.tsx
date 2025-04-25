
"use client";

import { FileText, Plus, Calendar } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useStepper } from "@/components/ui/stepper";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotLoader } from "@/hooks/useSnapshotLoader";
import { useTaskHistory } from "@/lib/react-query";
import { format } from "date-fns";

export function TaskHistory() {
  const { user } = useUser();
  const { fileId, setFileId, setFeedbackData, setAdviceData } =
    useInterviewDataStore();
  const { loadSnapshot } = useSnapshotLoader(null, false);
  const { goToStep } = useStepper();
  const { goToStep } = useStepper();

  const { data: tasks = [], isLoading: isTasksLoading } = useTaskHistory(
    user?.id,
  );

  const loading = isTasksLoading;

  // Function to format date - using current date as fallback
  const formatDate = () => {
    try {
      return format(new Date(), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Unknown date";
    }
  };

  const handleTaskClick = async (
    file_id: string | null,
    snapShotId?: number,
  ) => {
    try {
      console.log("Task clicked:", file_id, snapShotId);
      
      if (file_id === null) {
        console.log("Setting fileId to null (new task)");
        setFileId(file_id);
        // Navigate to the first step (Upload PDF screen) for new tasks
        console.log("Navigating to Upload PDF screen (step 1)");
        goToStep(1);
        return;
      }
      
      // Set the file ID first - this will clear existing data in the store
      console.log("Setting fileId to:", file_id);
      setFileId(file_id);
      
      // Always navigate to the second step (Feedback screen)
      console.log("Navigating to Feedback screen (step 2)");
      goToStep(2);
      
      // Then load the snapshot if available
      if (snapShotId) {
        console.log("Loading snapshot:", snapShotId);
        try {
          const snapshotData = await loadSnapshot(snapShotId);
          if (snapshotData) {
            console.log("Snapshot loaded successfully");
          } else {
            console.log("No snapshot data found - empty templates initialized");
          }
        } catch (error) {
          console.error("Error loading snapshot:", error);
          // Continue even if snapshot loading fails
          // The user can still see the file without the snapshot
          console.log("Continuing without snapshot - empty templates initialized");
        }
      } else {
        console.log("No snapshot ID available for this task - initializing empty templates");
        // Explicitly load empty templates when no snapshot ID is available
        try {
          await loadSnapshot(null);
          console.log("Empty templates initialized successfully");
        } catch (error) {
          console.error("Error initializing empty templates:", error);
        }
      }
    } catch (error) {
      console.error("Error in handleTaskClick:", error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-semibold">Task History</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="flex gap-3 items-center text-center bg-blue-50 hover:bg-blue-100"
              onClick={() => handleTaskClick(null)}
              isActive={!fileId}
            >
              <Plus size={14} className="text-blue-600" />
              <span className="font-medium">New Task</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {loading ? (
            // Show skeletons while loading
            Array.from({ length: 5 }).map((_, index) => (
              <SidebarMenuSkeleton key={index} showIcon={true} />
            ))
          ) : tasks && tasks.length > 0 ? (
            // Show tasks if available
            tasks.map((task) => (
              <SidebarMenuItem key={task.id}>
                <SidebarMenuButton
                  onClick={() =>
                    handleTaskClick(task.file_id, task.current_snapshot_id)
                  }
                  tooltip={task.file_name || "Task"}
                  isActive={task.file_id === fileId}
                  className="hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <FileText className="text-gray-600" />
                  <span className="flex flex-col w-full overflow-hidden max-w-[200px]">
                    <span className="truncate font-medium">{task.file_name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Calendar size={10} />
                      <span className="truncate">{formatDate()}</span>
                    </span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))
          ) : (
            // Show message if no tasks
            <div className="px-2 py-4 text-sm text-muted-foreground">
              No tasks found. Upload a file to get started.
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
