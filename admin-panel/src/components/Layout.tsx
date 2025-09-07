import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: any
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
