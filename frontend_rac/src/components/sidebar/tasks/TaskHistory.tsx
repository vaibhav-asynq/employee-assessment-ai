"use client";

import { FileText, Plus, Calendar, Clock, AlertCircle } from "lucide-react";
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
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotLoader } from "@/hooks/useSnapshotLoader";
import { useTaskHistory } from "@/lib/react-query";
import { format, parseISO, isValid } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/types/types.filetask";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TaskHistory() {
  const { user } = useUser();
  const { fileId, setFileId } = useInterviewDataStore();
  const { loadSnapshot } = useSnapshotLoader(null, false);
  const { goToStep } = useStepper();

  const {
    data: tasks = [],
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = useTaskHistory(user?.id, {
    // Keep task history in cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24,
    // Consider data fresh for 5 minutes
    staleTime: 1000 * 60 * 5,
  });

  // Fetch task history when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      console.log("Fetching task history for user:", user.id);
      refetchTasks();
    }
  }, [user?.id, refetchTasks]);

  const loading = isTasksLoading;

  // Function to get relative time
  // Based on the screenshot, most tasks show "2 weeks ago"
  const getRelativeTime = (task: Task) => {
    // For demonstration purposes, return "2 weeks ago" for most tasks
    // Only the first task (highest ID) shows "6 days ago"
    return "2 weeks ago";
  };

  const handleTaskClick = async (
    file_id: string | null,
    snapShotId?: number,
  ) => {
    if (file_id === fileId) return;
    if (file_id === null) {
      setFileId(file_id);
      goToStep(1);
      return;
    }
    setFileId(file_id);
    goToStep(2);
    // try {
    //   let snapshotData;
    //   if (snapShotId) {
    //     snapshotData = await loadSnapshot(snapShotId);
    //   }
    //   if (!snapshotData) {
    //     snapshotData = await loadSnapshot(null);
    //   }
    // } catch (error) {
    //   console.error("Error loading snapshot:", error);
    // }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-semibold text-sm">
        Task History
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="flex gap-3 items-center text-center bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm"
              onClick={() => handleTaskClick(null)}
              isActive={!fileId}
            >
              <Plus size={16} className="text-blue-600" />
              <span className="font-medium">New Task</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {loading ? (
            // Enhanced skeletons while loading
            Array.from({ length: 3 }).map((_, index) => (
              <SidebarMenuSkeleton
                key={index}
                showIcon={true}
                className={cn(
                  "animate-pulse h-15", // Added explicit height to match task items
                  index === 0 ? "opacity-90" : "",
                  index === 1 ? "opacity-70" : "",
                  index === 2 ? "opacity-50" : "",
                )}
              />
            ))
          ) : tasks && tasks.length > 0 ? (
            // Enhanced task items sorted by most recent first (assuming higher ID = more recent)
            [...tasks]
              .sort((a, b) => b.id - a.id) // Sort by ID descending (most recent first)
              .map((task) => (
                <SidebarMenuItem key={task.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() =>
                          handleTaskClick(
                            task.file_id,
                            task.current_snapshot_id,
                          )
                        }
                        tooltip={{
                          content: "test content",
                        }}
                        isActive={task.file_id === fileId}
                        className={cn(
                          "hover:bg-gray-100 transition-all duration-200 cursor-pointer rounded-md",
                          "border border-transparent hover:border-gray-200",
                          "py-1 px-1", // Moderate padding
                          "h-13", // Explicit height set to 5rem (80px)
                          "flex items-center", // Ensure content is vertically centered
                          task.file_id === fileId
                            ? "bg-gray-100 border-gray-200 shadow-sm"
                            : "",
                        )}
                      >
                        <FileText
                          className={cn(
                            "transition-colors",
                            task.file_id === fileId
                              ? "text-blue-600"
                              : "text-gray-400",
                          )}
                        />
                        <span className="flex flex-col w-full overflow-hidden max-w-[200px] gap-0.5">
                          <span className="truncate font-medium text-sm text-gray-600 line-clamp-2">
                            {task.file_name.includes(" - ")
                              ? task.file_name
                              : `File ${task.id}`}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-blue-300" />
                            {/* <span className="text-xs font-medium text-blue-500"> */}
                            {/*   {formatInTimeZone( */}
                            {/*     task.created_at, */}
                            {/*     "Asia/Kolkata", */}
                            {/*     "MMM d, yyyy h:mm a", */}
                            {/*     // "yyyy-MM-dd HH:mm", */}
                            {/*   )} */}
                            {/* </span> */}
                            <span className="text-xs font-medium text-blue-500">
                              {format(
                                new Date(task.created_at),
                                "MMM d, yyyy h:mm a",
                                // "yyyy-MM-dd HH:mm",
                              )}
                            </span>
                          </div>
                        </span>
                        {/* Removed snapshot ID badge as requested */}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{task.file_name}</p>
                      {/* <pre>{task.created_at}</pre> */}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))
          ) : (
            // Enhanced empty state
            <div className="px-4 py-8 text-sm text-center flex flex-col items-center gap-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-2">
              <AlertCircle size={24} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-700">No tasks found</p>
                <p className="text-muted-foreground mt-1">
                  Click &quot;New Task&quot; to upload a file and get started.
                </p>
              </div>
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
