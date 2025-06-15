import { useState } from "react"
import { Toolbar } from "../components/Toolbar"
import { Collection, JapaneseWord, ViewMode } from "../types"
import { Archive, Plus, ArrowLeft } from "lucide-react"
import { LayoutContainer } from "../components/LayoutContainer"
import { ManualInput } from "./add-cards/ManualInput"
import { FreeTextInput } from "./add-cards/FreeTextInput"
import { ImageInput } from "./add-cards/ImageInput"
import { colors } from "@/lib/colors"
import { Button } from "@/components/ui/button"

type InputMode = "manual" | "free" | "image"

interface AddCardsViewProps {
    setViewMode: (mode: ViewMode) => void;
}

export const AddCardsView = ({ setViewMode }: AddCardsViewProps) => {
    const [inputMode, setInputMode] = useState<InputMode>("manual")

    const inputModeOptions: { mode: InputMode, label: string }[] = [
        { mode: "manual", label: "Вручную" },
        { mode: "free", label: "Из текста" },
        { mode: "image", label: "Из изображения" },
    ]

    return (
        <LayoutContainer>
            <Toolbar>
                <div className="flex space-x-2">
                    <Button variant="ghost" onClick={() => setViewMode("pool")}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Все карточки
                    </Button>
                </div>
            </Toolbar>
            <div className="flex justify-center space-x-4">
                {inputModeOptions.map((option) => (
                    <button
                        key={option.mode}
                        onClick={() => setInputMode(option.mode)}
                        className={`px-4 py-2 rounded-md transition-colors
                            ${inputMode === option.mode
                                ? `${colors.ui.button.modeToggle.activeBg} ${colors.ui.button.modeToggle.activeText}`
                                : `${colors.ui.button.modeToggle.inactiveBg} ${colors.ui.button.modeToggle.inactiveText} ${colors.ui.button.modeToggle.inactiveHoverBg}`
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div className="mt-8 max-w-3xl mx-auto px-4">
                {inputMode === "manual" && <ManualInput />}
                {inputMode === "free" && <FreeTextInput />}
                {inputMode === "image" && <ImageInput />}
            </div>
        </LayoutContainer>
    )
} 