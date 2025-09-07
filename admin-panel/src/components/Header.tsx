import { LanguageSelector } from './LanguageSelector'

export function Header() {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-secondary-200">
      <button
        type="button"
        className="px-4 border-r border-secondary-200 text-secondary-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1 px-4 flex justify-between">
        {/* <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-secondary-400 focus-within:text-secondary-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-secondary-900 placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-0 focus:border-transparent sm:text-sm"
                placeholder="Search..."
                type="search"
                name="search"
              />
            </div>
          </div>
        </div> */}
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          <LanguageSelector />
          {/* <button className="bg-white p-1 rounded-full text-secondary-400 hover:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            <span className="sr-only">View notifications</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 012 21.6V19a2 2 0 00-2-2H2a2 2 0 002-2V8.414a1 1 0 00-.293-.707l-1.414-1.414A1 1 0 002.586 6H5a1 1 0 001-1V4a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h2.586a1 1 0 00.707.293l1.414 1.414A1 1 0 0014 8.414V10a2 2 0 002 2v2a2 2 0 00-2 2v2.6a17.925 17.925 0 01-1.868-8.917z" />
            </svg>
          </button>

          <div className="ml-3 relative">
            <div>
              <button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium">
                  A
                </div>
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
