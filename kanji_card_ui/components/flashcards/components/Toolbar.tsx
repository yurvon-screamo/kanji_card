import { ReactNode } from "react"
import { colors } from "@/lib/colors"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface ToolbarProps {
    children: ReactNode
}

export const Toolbar = ({ children }: ToolbarProps) => {
    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] ${colors.ui.toolbar.bg} backdrop-blur-sm ${colors.ui.toolbar.border}`}>
            <div className="max-w-screen-lg mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {children}
                    <ThemeToggle />
                </div>
            </div>
        </div>
    )
}