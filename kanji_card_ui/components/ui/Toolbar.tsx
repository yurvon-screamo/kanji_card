import { ReactNode } from "react"
import { colors } from "@/lib/theme"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useAuth } from "@/lib/hooks/use-auth"
import { SignOut24Regular } from "@fluentui/react-icons"
import { Button } from "@fluentui/react-components"

interface ToolbarProps {
    children: ReactNode
}

export const Toolbar = ({ children }: ToolbarProps) => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className={`fixed top-0 left-0 right-0 z-[100] ${colors.ui.toolbar.bg} backdrop-blur-sm ${colors.ui.toolbar.border}`}>
            <div className="max-w-screen-lg mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {children}
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        {user && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {user.login}
                                </span>
                                <Button
                                    onClick={handleLogout}
                                    appearance="subtle"
                                    icon={<SignOut24Regular />}
                                    title="Выйти"
                                    size="small"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}