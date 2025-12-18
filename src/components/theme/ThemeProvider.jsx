import { createContext, useContext, useEffect, useState } from "react"

const initialState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "dark",
    storageKey = "ui-theme",
    ...props
}) {
    const [theme, setTheme] = useState(
        () => localStorage.getItem(storageKey) || defaultTheme
    )

    const [density, setDensity] = useState(
        () => localStorage.getItem("ui-density") || "default"
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark", "gray", "black")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
    }, [theme])

    useEffect(() => {
        const root = window.document.documentElement
        root.setAttribute("data-density", density)
    }, [density])

    const value = {
        theme,
        setTheme: (theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        density,
        setDensity: (newDensity) => {
            localStorage.setItem("ui-density", newDensity)
            setDensity(newDensity)
        }
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
