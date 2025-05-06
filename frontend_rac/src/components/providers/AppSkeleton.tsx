//INFO: [this will work if ClerkProvider is dynamic]
export function AppSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <div className="flex flex-col items-center gap-6">
        <div
          className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] w-12 h-12"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
        <div className="text-muted-foreground text-center">
          <p className="text-lg font-medium">Initializing application</p>
          <p className="text-sm">Please wait while we set things up...</p>
        </div>
      </div>
    </div>
  );
}
