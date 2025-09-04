import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

interface Vacancy {
  id: number
  title: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export function Vacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVacancies()
  }, [])

  const fetchVacancies = async () => {
    try {
      const response = await fetch('/api/vacancies')
      const result = await response.json()

      if (result.success) {
        setVacancies(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch vacancies')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Vacancies</h1>
        <button
          onClick={() => window.location.href = '/vacancies/new'}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Add New Vacancy
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="text-secondary-600">Loading vacancies...</p>
        ) : vacancies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary-600 mb-4">No vacancies found.</p>
            <button
              onClick={() => window.location.href = '/vacancies/new'}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Create Your First Vacancy
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {vacancies.map((vacancy) => (
              <div key={vacancy.id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900">{vacancy.title}</h3>
                    <p className="text-secondary-600 mt-1">{vacancy.description}</p>
                    <div className="flex items-center mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vacancy.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {vacancy.status}
                      </span>
                      <span className="text-secondary-500 text-sm ml-4">
                        Created: {new Date(vacancy.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm text-secondary-600 border border-secondary-300 rounded hover:bg-secondary-50">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
