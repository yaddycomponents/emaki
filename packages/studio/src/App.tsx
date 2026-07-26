import { useEffect } from 'react'
import { useStudio } from './store'
import { Studio } from './views/Studio'
import { FirstRun } from './views/FirstRun'
import { TemplateGallery } from './views/TemplateGallery'
import { ThemeGallery } from './views/ThemeGallery'
import { ThemeImport } from './views/ThemeImport'
import { ThemeBlank } from './views/ThemeBlank'
import { Inventory } from './views/Inventory'

export function App() {
  const view = useStudio((x) => x.view)
  const chrome = useStudio((x) => x.chrome)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', chrome)
  }, [chrome])

  switch (view) {
    case 'first-run':
      return <FirstRun />
    case 'templates':
      return <TemplateGallery />
    case 'theme-gallery':
      return <ThemeGallery />
    case 'theme-import':
      return <ThemeImport />
    case 'theme-blank':
      return <ThemeBlank />
    case 'inventory':
      return <Inventory />
    default:
      return <Studio />
  }
}
