'use client'

import { Globe, LogOut, Moon, Sun, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { logout } from '@/lib/auth-helpers'
import { useTranslations } from '@/lib/i18n'
import { useLocaleStore } from '@/store/locale-store'
import { Locale } from '@/lib/i18n'
import { MobileSidebar } from './mobile-sidebar'

export function Topbar() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
  }

  return (
    <header className="h-14 sm:h-16 border-b bg-card flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <h1 className="text-lg sm:text-xl font-bold truncate">Mooprompt Restaurant</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleLocaleChange('th')}
              className="flex items-center justify-between"
            >
              <span>ไทย</span>
              {locale === 'th' && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleLocaleChange('en')}
              className="flex items-center justify-between"
            >
              <span>English</span>
              {locale === 'en' && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" onClick={logout} className="text-xs sm:text-sm">
          <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('auth.logout')}</span>
        </Button>
      </div>
    </header>
  )
}

