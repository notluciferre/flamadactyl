import * as React from "react";

import { cn } from "@/lib/utils";

export function Section({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("w-full px-4 py-16 md:px-6 md:py-24", className)}
      {...props}
    />
  );
}
