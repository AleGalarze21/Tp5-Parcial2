import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-[var(--primary)] text-white hover:brightness-95",
      outline: "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-slate-50",
      ghost: "text-[var(--foreground)] hover:bg-slate-100",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      link: "text-[var(--primary)] underline-offset-4 hover:underline",
    },
    size: { default: "h-10", sm: "h-9 px-3", icon: "size-10 p-0" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
