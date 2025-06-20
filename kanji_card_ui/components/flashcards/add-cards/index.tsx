import React, { useState } from "react"
import { Toolbar } from "../../ui/Toolbar"
import { ViewMode } from "../shared"
import { ArrowLeft } from "lucide-react"
import { LayoutContainer } from "../../ui/LayoutContainer"
import { ManualInput } from "./ManualInput"
import { FreeTextInput } from "./FreeTextInput"
import { ImageInput } from "./ImageInput"
import { Button, ToggleButton } from "@fluentui/react-components"

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
                    <Button appearance="subtle" onClick={() => setViewMode("pool")}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Все карточки
                    </Button>
                </div>
            </Toolbar>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {inputModeOptions.map((option) => (
                    <ToggleButton
                        key={option.mode}
                        checked={inputMode === option.mode}
                        onClick={() => setInputMode(option.mode)}
                        appearance={inputMode === option.mode ? "primary" : "secondary"}
                    >
                        {option.label}
                    </ToggleButton>
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