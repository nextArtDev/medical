'use client'

import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2 ">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        onClick={() => setTheme('light')}
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        onClick={() => setTheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'dashboard' ? 'default' : 'outline'}
        onClick={() => setTheme('dashboard')}
      >
        Dashboard
      </Button>
      <Button
        variant={theme === 'home' ? 'default' : 'outline'}
        onClick={() => setTheme('home')}
      >
        Home
      </Button>
    </div>
  )
}
