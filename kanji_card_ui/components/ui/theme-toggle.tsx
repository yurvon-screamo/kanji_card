import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { colors } from "@/lib/colors";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-md ${colors.ui.button.modeToggle.inactiveHoverBg} transition-colors`}
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className={`h-5 w-5 ${colors.ui.text.primary}`} />
            ) : (
                <Moon className={`h-5 w-5 ${colors.ui.text.slate}`} />
            )}
        </button>
    );
} 