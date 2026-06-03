"use client";

import { useEffect, useState } from "react";

import { Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type EmojiData = { native: string };

type Props = {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
};

export function EmojiPickerButton({ onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  // Dynamically import the heavy picker only when the popover is opened
  const [Picker, setPicker] = useState<React.ComponentType<{
    data: unknown;
    onEmojiSelect: (e: EmojiData) => void;
    theme: string;
    locale: string;
    previewPosition: string;
    skinTonePosition: string;
    navPosition: string;
    perLine: number;
    maxFrequentRows: number;
  }> | null>(null);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    if (!open || Picker) return;
    Promise.all([
      import("@emoji-mart/react"),
      import("@emoji-mart/data"),
    ]).then(([mod, dataMod]) => {
      setData(dataMod.default);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPicker(() => mod.default as any);
    });
  }, [open, Picker]);

  function handleSelect(emoji: EmojiData) {
    onSelect(emoji.native);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-0 p-0 shadow-xl"
        side="top"
        align="start"
        sideOffset={8}
      >
        {Picker && data ? (
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme="light"
            locale="fr"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="top"
            perLine={8}
            maxFrequentRows={1}
          />
        ) : (
          <div className="flex h-[300px] w-[300px] items-center justify-center text-sm text-muted-foreground">
            Chargement…
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
