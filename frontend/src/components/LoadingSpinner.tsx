import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="mt-3 text-sm text-ink-muted dark:text-ink-muted-dark">{text}</p>
    </div>
  );
}
