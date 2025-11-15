import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function useErrorHandler() {
  const { toast } = useToast();
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((err: unknown) => {
    const errorMessage =
      (err as any)?.response?.data?.message ||
      (err as Error)?.message ||
      "An error occurred";

    setError(err as Error);

    toast({
      variant: "destructive",
      title: "Error",
      description: errorMessage,
    });
  }, [toast]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}
