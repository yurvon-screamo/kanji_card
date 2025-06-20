"use client"

import { FluentProvider, webLightTheme, webDarkTheme } from "@fluentui/react-components";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const currentTheme = theme === 'dark' || resolvedTheme === 'dark' ? webDarkTheme : webLightTheme;

    return (
        <FluentProvider theme={currentTheme}>
            {children}
        </FluentProvider>
    );
}