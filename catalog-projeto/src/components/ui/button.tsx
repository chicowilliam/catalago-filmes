import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { ComponentPropsWithoutRef } from "react"

import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentPropsWithoutRef<typeof ButtonPrimitive> & ButtonVariantProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button }
