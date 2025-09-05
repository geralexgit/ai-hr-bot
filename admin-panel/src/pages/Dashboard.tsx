import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { fetchDashboardStats, DashboardStats } from '../services/dashboardService'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleFetchStats()
  }, [])

  const handleFetchStats = async () => {
    setLoading(true)
    setError(null)
    
    const result = await fetchDashboardStats()
    if (result.success && result.data) {
      setStats(result.data)
    } else {
      setError(result.error?.message || 'Failed to fetch dashboard statistics')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-secondary-200 rounded mb-2"></div>
              <div className="h-8 bg-secondary-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button 
            onClick={handleFetchStats}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-secondary-900 mb-6">Dashboard</h1>
      
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Active Vacancies</h3>
          <p className="text-3xl font-bold text-primary-600">{stats?.activeVacancies || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Total Candidates</h3>
          <p className="text-3xl font-bold text-success-600">{stats?.totalCandidates || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Interviews Today</h3>
          <p className="text-3xl font-bold text-warning-600">{stats?.interviewsToday || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-success-600">{stats?.successRate || 0}%</p>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">Recent Activity (7 days)</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-secondary-700">New Candidates</span>
              <span className="font-semibold text-primary-600">{stats?.recentActivity.newCandidatesThisWeek || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-700">New Evaluations</span>
              <span className="font-semibold text-success-600">{stats?.recentActivity.newEvaluationsThisWeek || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-700">Active Dialogues (24h)</span>
              <span className="font-semibold text-warning-600">{stats?.recentActivity.activeDialogues || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">Evaluation Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-secondary-700">Proceed</span>
              <span className="font-semibold text-success-600">{stats?.evaluationBreakdown.proceed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-700">Reject</span>
              <span className="font-semibold text-red-600">{stats?.evaluationBreakdown.reject || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-700">Clarify</span>
              <span className="font-semibold text-warning-600">{stats?.evaluationBreakdown.clarify || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Evaluations Card */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-2">Total Evaluations</h3>
        <p className="text-2xl font-bold text-secondary-700">{stats?.totalEvaluations || 0}</p>
        <p className="text-sm text-secondary-500 mt-1">All-time evaluation count</p>
      </div>
    </div>
  )
}
