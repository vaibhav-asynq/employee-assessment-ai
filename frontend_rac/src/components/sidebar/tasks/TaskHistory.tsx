"use client";

import {
  FileText,
  Plus,
  Calendar,
  AlertCircle,
  Trash2,
  Loader2,
  Search,
  X,
} from "lucide-react";
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
import { useDeleteFileTask, useTaskHistory } from "@/lib/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getToLocalTime } from "@/lib/timeStamp";

export function TaskHistory() {
  const { user } = useUser();
  const { fileId, setFileId } = useInterviewDataStore();
  const { goToStep } = useStepper();
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: number;
    fileId: string;
    name: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { loadSnapshot } = useSnapshotLoader(null, false);

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

  const { mutateAsync: deleteTask, isPending: isDeleting } =
    useDeleteFileTask();

  // Fetch task history when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      refetchTasks();
    }
  }, [user?.id, refetchTasks]);

  const loading = isTasksLoading;
  const isAnyTaskDeleting = deletingTaskId !== null || isDeleting;

  // Fuzzy search function for filtering tasks
  const filterTasks = (tasks: any[], query: string) => {
    if (!query.trim()) return tasks;

    const lowerQuery = query.toLowerCase().trim();
    return tasks.filter((task) => {
      const taskName = task.file_name.toLowerCase();
      const taskDate = format(
        new Date(task.created_at),
        "MMM d, yyyy h:mm a",
      ).toLowerCase();

      // Simple fuzzy search - check if any part of the string contains the query
      return taskName.includes(lowerQuery) || taskDate.includes(lowerQuery);
    });
  };

  const filteredTasks = filterTasks(tasks, searchQuery);

  const handleTaskClick = async (file_id: string | null) => {
    // Prevent task switching during deletion
    if (isAnyTaskDeleting) return;

    if (file_id === fileId) return;
    setFileId(file_id);
    if (file_id === null) {
      goToStep(1);
      return;
    }
    goToStep(2);
    await loadSnapshot(file_id);
  };

  const handleDeleteTask = async (
    e: React.MouseEvent,
    taskId: number,
    fileId: string,
    fileName: string,
  ) => {
    e.stopPropagation(); // Prevent task selection when clicking delete

    if (isAnyTaskDeleting) return;

    // Open confirmation dialog
    setTaskToDelete({ id: taskId, fileId, name: fileName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || isAnyTaskDeleting) return;

    try {
      setDeletingTaskId(taskToDelete.id);
      await deleteTask(taskToDelete.id);

      // If the deleted task was the active one, reset to new task view
      if (taskToDelete.fileId === fileId) {
        setFileId(null);
        goToStep(1);
      }

      // Refresh task list
      refetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setDeletingTaskId(null);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const cancelDeleteTask = () => {
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  return (
    <>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-gray-700">
              {taskToDelete?.name || "Unknown task"}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteTask}
              disabled={isAnyTaskDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTask}
              disabled={isAnyTaskDeleting}
            >
              {deletingTaskId === taskToDelete?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SidebarGroup>
        <SidebarGroupLabel className="font-semibold text-sm">
          Task History
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="relative mb-2">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 py-1 h-8 text-sm"
              disabled={loading || isAnyTaskDeleting}
            />
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className={cn(
                  "flex gap-3 items-center text-center bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm",
                  isAnyTaskDeleting ? "pointer-events-none opacity-70" : "",
                )}
                onClick={() => handleTaskClick(null)}
                isActive={!fileId}
                disabled={isAnyTaskDeleting}
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
              filteredTasks.length > 0 ? (
                // Enhanced task items sorted by most recent first (assuming higher ID = more recent)
                [...filteredTasks]
                  .sort((a, b) => b.id - a.id) // Sort by ID descending (most recent first)
                  .map((task) => (
                    <SidebarMenuItem key={task.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => handleTaskClick(task.file_id)}
                            tooltip={{
                              content: "test content",
                            }}
                            isActive={task.file_id === fileId}
                            className={cn(
                              "relative group/[item]",
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
                                <span className="text-xs font-medium text-blue-500">
                                  {task.created_at
                                    ? `${getToLocalTime(
                                        new Date(task.created_at),
                                        "MMM d, yyyy h:mm a",
                                      )}`
                                    : "N/A"}
                                </span>
                              </div>
                            </span>

                            {/* Delete button */}
                            <button
                              onClick={(e) =>
                                handleDeleteTask(
                                  e,
                                  task.id,
                                  task.file_id,
                                  task.file_name,
                                )
                              }
                              className={cn(
                                "hidden group-hover/[item]:block absolute right-0",
                                "group/[delete]",
                                "ml-auto p-1.5 rounded-full bg-red-100/80 hover:bg-red-100 transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50",
                                deletingTaskId === task.id
                                  ? "pointer-events-none"
                                  : "",
                              )}
                              disabled={isAnyTaskDeleting}
                              aria-label="Delete task"
                            >
                              {deletingTaskId === task.id ? (
                                <Loader2
                                  size={16}
                                  className="text-red-500 animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={16}
                                  className="text-gray-400 group-hover/[delete]:text-red-500 transition-colors"
                                />
                              )}
                            </button>

                            {/* Removed snapshot ID badge as requested */}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{task.file_name}</p>
                          {/* <pre>{task.created_at}</pre> */}
                          {/* <pre>{task.file_id}</pre> */}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  ))
              ) : (
                // No search results state
                <div className="px-4 py-6 text-sm text-center flex flex-col items-center gap-2 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-2">
                  <Search size={20} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">
                      No matching tasks
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-1 text-xs"
                  >
                    Clear search
                  </Button>
                </div>
              )
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
    </>
  );
}
