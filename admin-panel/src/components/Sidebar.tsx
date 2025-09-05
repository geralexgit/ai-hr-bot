import { h } from 'preact'
import { Link } from 'preact-router/match'

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Vacancies', href: '/vacancies', icon: '💼' },
  { name: 'Candidates', href: '/candidates', icon: '👥' },
  { name: 'Reports', href: '/reports', icon: '📈' },
]

export function Sidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-secondary-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-primary-600">AI HR Bot</h1>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900"
                activeClassName="bg-primary-50 text-primary-700"
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
