import { useState } from "react"
import { colors } from "@/lib/colors"
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
            <button
                onClick={() => setShowEditor(true)}
                className={`w-full ${colors.ui.button.primary.bg} ${colors.ui.button.primary.text} py-2 px-4 rounded-md ${colors.ui.button.primary.hoverBg}`}
            >
                Добавить карточки
            </button>
        </div>
    )
} 