import { useState, useEffect } from 'preact/hooks'
import { fetchVacancies, deleteVacancy, Vacancy } from '../services/vacanciesService'

export function Vacancies() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    handleFetchVacancies()
  }, [])

  const handleFetchVacancies = async () => {
    const result = await fetchVacancies()
    if (result.success && result.data) {
      // Debug logging to check date format
      if (result.data.length > 0) {
        console.log('Sample vacancy data:', result.data[0])
        console.log('CreatedAt value:', result.data[0].createdAt, 'Type:', typeof result.data[0].createdAt)
      }
      setVacancies(result.data)
    } else {
      setError(result.error?.message || 'Failed to fetch vacancies')
    }
    setLoading(false)
  }

  const handleDeleteVacancy = async (vacancyId: number, vacancyTitle: string) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the vacancy "${vacancyTitle}"? This action cannot be undone.`)) {
      return
    }

    // Add to deleting set
    setDeletingIds(prev => new Set([...prev, vacancyId]))
    setError(null)

    try {
      const result = await deleteVacancy(vacancyId)
      
      if (result.success) {
        // Remove from local state
        setVacancies(prev => prev.filter(v => v.id !== vacancyId))
      } else {
        setError(result.error?.message || 'Failed to delete vacancy')
      }
    } catch (err) {
      setError('Network error occurred while deleting vacancy')
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(vacancyId)
        return newSet
      })
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
                      {/* <span className="text-secondary-500 text-sm ml-4">
                        Created: {formatDate(vacancy.createdAt)}
                      </span> */}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.location.href = `/vacancies/edit/${vacancy.id}`}
                      className="px-3 py-1 text-sm text-secondary-600 border border-secondary-300 rounded hover:bg-secondary-50"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteVacancy(vacancy.id, vacancy.title)}
                      disabled={deletingIds.has(vacancy.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingIds.has(vacancy.id) ? 'Deleting...' : 'Delete'}
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
