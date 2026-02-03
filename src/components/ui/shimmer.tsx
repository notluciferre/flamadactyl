"use client"

import { cn } from "@/lib/utils"

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-24 animate-pulse rounded-md bg-zinc-700/50",
        className
      )}
    />
  )
}
