import { ReactNode } from "react"
import { colors } from "@/lib/colors"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/lib/hooks/use-auth"

interface ToolbarProps {
    children: ReactNode
}

export const Toolbar = ({ children }: ToolbarProps) => {
    const { user } = useAuth();

    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] ${colors.ui.toolbar.bg} backdrop-blur-sm ${colors.ui.toolbar.border}`}>
            <div className="max-w-screen-lg mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {children}
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        {user && (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {user.login}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}