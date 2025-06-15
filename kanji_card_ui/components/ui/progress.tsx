import * as React from "react"
import { cn } from "@/lib/utils"
import { colors } from "@/lib/colors"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
    ({ className, value, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative h-2 w-full overflow-hidden rounded-full",
                    colors.ui.button.modeToggle.inactiveBg,
                    className
                )}
                {...props}
            >
                <div
                    className={cn(
                        "h-full w-full flex-1 transition-all",
                        colors.ui.button.modeToggle.activeBg
                    )}
                    style={{ width: `${value}%` }}
                />
            </div>
        )
    }
)
Progress.displayName = "Progress"

export { Progress } 