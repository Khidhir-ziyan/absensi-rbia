import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-surface-2 dark:bg-surface-dark-2 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-ink-muted dark:text-ink-muted-dark" />
      </div>
      <h3 className="font-medium text-ink dark:text-ink-dark mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
