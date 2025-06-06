```ts
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config
```


For Next.js 15 with shadcn/ui and Tailwind CSS v4, you can implement multiple color palettes beyond just dark/light by creating custom theme variants. Here's how to approach this:

```tsx
// lib/themes.ts
export type Theme = "light" | "dark" | "dashboard" | "home";

// components/theme-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove("light", "dark", "dashboard", "home")
    
    // Add the current theme class
    root.classList.add(theme)
    
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
```

Then update your Tailwind config to include the new theme variants:

```js
// tailwind.config.js
module.exports = {
  darkMode: ["class", '[class="dark"]'],
  theme: {
    extend: {
      colors: {
        // Your base colors
      }
    }
  },
  plugins: [
    require('tailwindcss-animate'),
    plugin(({ addVariant }) => {
      // Add custom theme variants
      addVariant("dashboard", '[class="dashboard"] &')
      addVariant("home", '[class="home"] &')
    }),
  ],
}
```

Finally, create CSS variables for each theme in your globals.css:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme variables */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* other variables */
  }

  .dark {
    /* Dark theme variables */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* other variables */
  }
  
  .dashboard {
    /* Dashboard theme variables */
    --background: 200 50% 95%;
    --foreground: 200 50% 20%;
    /* other dashboard-specific colors */
  }
  
  .home {
    /* Home theme variables */
    --background: 35 100% 95%;
    --foreground: 35 100% 20%;
    /* other home-specific colors */
  }
}
```

Now you can switch between themes in your components:

```tsx
"use client"

import { useTheme } from "@/components/theme-provider"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("dashboard")}>Dashboard</button>
      <button onClick={() => setTheme("home")}>Home</button>
    </div>
  )
}
```

Would you like me to explain or break down this code?

Yes, exactly. In that section of the Tailwind config, you would define your base color palette that will be used across all themes. These are typically the semantic color names that shadcn/ui uses, which are then mapped to CSS variables.

For shadcn/ui, you'd typically include colors like:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    }
  }
}
```

These color definitions don't change between themes. Instead, the actual HSL values defined in the CSS variables (like `--primary`, `--background`, etc.) will change based on which theme class is active on the root element.