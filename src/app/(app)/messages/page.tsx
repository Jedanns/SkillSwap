import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 h-full text-center p-8">
      <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium">Tes messages</p>
      <p className="text-xs text-muted-foreground">
        Sélectionne une conversation pour commencer.
      </p>
    </div>
  );
}
