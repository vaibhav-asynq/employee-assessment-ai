import { useState, useEffect } from "react";
import { useSnapshotHistory, useCurrentSnapshot } from "@/lib/react-query";
import { useInterviewDataStore } from "@/zustand/store/interviewDataStore";
import { useSnapshotLoader } from "@/hooks/useSnapshotLoader";
import { useSetCurrentSnapshot } from "@/lib/react-query/mutations";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function SnapshotHistoryContent() {
  const { fileId } = useInterviewDataStore();
  const [page, setPage] = useState(0);
  const limit = 5;
  const offset = page * limit;
  const { loadSnapshot } = useSnapshotLoader(null, false);
  const setCurrentSnapshot = useSetCurrentSnapshot();

  const [loadingSnapshotId, setLoadingSnapshotId] = useState<number | null>(
    null,
  );
  const [loadingStage, setLoadingStage] = useState<
    "loading" | "setting" | null
  >(null);

  // Get the current snapshot to highlight it
  const { data: currentSnapshot, isLoading: isLoadingCurrentSnapshot } =
    useCurrentSnapshot(fileId);

  const {
    data: snapshotsData = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSnapshotHistory(fileId, limit, offset);

  // Log snapshot data for debugging
  useEffect(() => {
    console.log("Snapshot history data:", {
      fileId,
      limit,
      offset,
      snapshotsData,
      isLoading,
      isError,
      currentSnapshot: currentSnapshot?.id,
    });
  }, [
    fileId,
    limit,
    offset,
    snapshotsData,
    isLoading,
    isError,
    currentSnapshot,
  ]);

  const snapshots = [...snapshotsData].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const manualSnapshots = snapshots.filter((s) => s.trigger_type !== "auto");
  const manualSnapshotMap = new Map();
  manualSnapshots.forEach((snapshot, index) => {
    manualSnapshotMap.set(snapshot.id, index + 1);
  });

  const handleLoadSnapshot = async (snapshotId: number) => {
    try {
      setLoadingSnapshotId(snapshotId);
      setLoadingStage("loading");

      // First load the snapshot data into the UI
      await loadSnapshot(null, snapshotId);

      // Then set it as the current snapshot in the database
      if (fileId) {
        setLoadingStage("setting");
        await setCurrentSnapshot.mutateAsync({
          fileId,
          snapshotId,
        });
        // Refetch the current snapshot to update the UI
        await refetch();
      }
    } catch (error) {
      console.error("Error loading snapshot:", error);
    } finally {
      setLoadingSnapshotId(null);
      setLoadingStage(null);
    }
  };

  const isCurrentSnapshot = (snapshotId: number) => {
    return currentSnapshot?.id === snapshotId;
  };

  const formatTriggerType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleNextPage = () => {
    if (snapshots.length === limit) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  };

  if (!fileId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Please select a file to view its snapshot history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching || isLoading}
          className="mb-2"
        >
          <RefreshCw
            size={16}
            className={cn(isRefetching ? "animate-spin" : "", "mr-2")}
          />
          Refresh
        </Button>
      </div>

      {isLoading || isLoadingCurrentSnapshot ? (
        // Loading state
        Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="mb-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))
      ) : isError ? (
        // Error state
        <div className="text-center py-4">
          <p className="text-destructive">Failed to load snapshots</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch()}
          >
            Try Again
          </Button>
        </div>
      ) : snapshots.length === 0 ? (
        // Empty state
        <div className="text-center py-4">
          <p className="text-muted-foreground">No snapshots found</p>
        </div>
      ) : (
        // Snapshots list
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.id}
              // className="border rounded-md p-3 hover:bg-accent/50 transition-colors"
              className={cn(
                "border rounded-md p-3 transition-colors",
                isCurrentSnapshot(snapshot.id)
                  ? "bg-accent border-primary"
                  : "hover:bg-accent/50",
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">
                    {snapshot.trigger_type === "auto"
                      ? "Auto snapshot"
                      : (snapshot.snapshot_name ??
                        `Snapshot ${manualSnapshotMap.get(snapshot.id) || ""}`)}
                  </h4>
                  <div className="text-xs text-muted-foreground">
                    <span className="italic">
                      (created{" "}
                      {formatDistanceToNow(new Date(snapshot.created_at), {
                        addSuffix: true,
                      })}
                      )
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Calendar size={12} />
                    <span>
                      {format(new Date(snapshot.created_at), "MMM d, yyyy")}
                    </span>
                    <Clock size={12} className="ml-2" />
                    <span>
                      {format(new Date(snapshot.created_at), "h:mm:ss a")}
                    </span>
                  </div>
                </div>
                <Badge variant="outline">
                  {formatTriggerType(snapshot.trigger_type)}
                </Badge>
              </div>
              <Button
                variant={
                  isCurrentSnapshot(snapshot.id) ? "default" : "secondary"
                }
                size="sm"
                className="w-full mt-2"
                onClick={() => handleLoadSnapshot(snapshot.id)}
                disabled={
                  isCurrentSnapshot(snapshot.id) ||
                  loadingSnapshotId !== null ||
                  setCurrentSnapshot.isPending
                }
              >
                {isCurrentSnapshot(snapshot.id)
                  ? "Current Snapshot"
                  : loadingSnapshotId === snapshot.id &&
                      loadingStage === "loading"
                    ? "Loading Snapshot Data..."
                    : loadingSnapshotId === snapshot.id &&
                        loadingStage === "setting"
                      ? "Setting as Current..."
                      : "Load This Snapshot"}
              </Button>
            </div>
          ))}

          {/* Pagination controls */}
          <SheetFooter className="flex justify-between items-center mt-6 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 0}
            >
              <ChevronLeft size={16} className="mr-1" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={snapshots.length < limit}
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          </SheetFooter>
        </div>
      )}
    </div>
  );
}

function SnapshotHistory() {
  const fileId = useInterviewDataStore((state) => state.fileId);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!fileId}
        >
          <History size={16} />
          Snapshot History
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[400px] sm:w-[540px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Snapshot History</SheetTitle>
          <SheetDescription>
            View and restore previous snapshots of your work
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <SnapshotHistoryContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default SnapshotHistory;
