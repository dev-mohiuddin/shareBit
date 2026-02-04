import { useCallback, useRef } from "react";

// Simple toast context for demo/dev. Replace with shadcn/ui or Radix toast for production.
export function useToast() {
  const toastRef = useRef(null);

  const toast = useCallback(({ title, description, variant = "default" }) => {
    // You can replace this with a real toast system (Radix, shadcn, etc)
    // For now, just use alert() for demo/dev
    if (typeof window !== "undefined") {
      window.alert(`${title ? title + ': ' : ''}${description || ''}`);
    }
    // Optionally, set a ref for custom UI
    toastRef.current = { title, description, variant };
  }, []);

  return { toast };
}
