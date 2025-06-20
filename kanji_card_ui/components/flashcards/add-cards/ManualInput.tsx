import React, { useState } from "react"
import { colors } from "@/lib/theme"
import { PlusIcon } from "lucide-react"
import { Button } from "@fluentui/react-components"
import { ExtractedWordsEditor } from "./ExtractedWordsEditor"

export const ManualInput = () => {
    const [showEditor, setShowEditor] = useState(false)

    if (showEditor) {
        return (
            <ExtractedWordsEditor
                initialWords={[{ word: "", reading: null, translation: "" }]}
                onSave={() => setShowEditor(false)}
                onCancel={() => setShowEditor(false)}
            />
        )
    }

    return (
        <div className="space-y-4">
            <p className={`text-sm ${colors.ui.text.secondary} mb-2`}>
                Добавьте новые карточки вручную. Вы можете указать кандзи, чтение и
                перевод для каждой карточки.
            </p>
            <Button
                onClick={() => setShowEditor(true)}
                appearance="primary"
                icon={<PlusIcon className="w-4 h-4" />}
                style={{ width: "100%" }}
            >
                Добавить карточки
            </Button>
        </div>
    )
}