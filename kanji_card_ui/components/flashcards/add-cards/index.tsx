import React, { useState } from "react"
import { ViewMode } from "../shared"
import { ArrowLeft } from "lucide-react"
import { LayoutContainer } from "../../ui/LayoutContainer"
import { Toolbar } from "../../ui/Toolbar"
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
        <>
            <Toolbar>
                <div className="flex space-x-2">
                    <Button appearance="subtle" onClick={() => setViewMode("pool")}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Все карточки
                    </Button>
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
            </Toolbar>

            <div className="pt-16">
                <LayoutContainer>
                    <div className="max-w-3xl mx-auto px-4 py-8">
                        {inputMode === "manual" && <ManualInput />}
                        {inputMode === "free" && <FreeTextInput />}
                        {inputMode === "image" && <ImageInput />}
                    </div>
                </LayoutContainer>
            </div>
        </>
    )
}