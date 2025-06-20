"use client";

import { Button } from "@fluentui/react-components";
import { WeatherSunny24Regular, WeatherMoon24Regular } from "@fluentui/react-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <Button 
            appearance="transparent"
            icon={theme === 'dark' ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
            onClick={toggleTheme} 
            aria-label="Toggle theme"
        />
    );
}