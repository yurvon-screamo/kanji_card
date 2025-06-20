import { ReactNode } from "react"

interface LayoutContainerProps {
    children: ReactNode
}

export const LayoutContainer = ({ children }: LayoutContainerProps) => {
    return (
        <div className="min-h-screen pt-32">
            {children}
        </div>
    )
}