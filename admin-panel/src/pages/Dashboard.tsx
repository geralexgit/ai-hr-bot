import { useState, useEffect } from 'preact/hooks'
import { useI18n } from '../hooks/useI18n'
import { fetchDashboardStats, DashboardStats } from '../services/dashboardService'

export function Dashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetchDashboardStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        setError(response.error?.message || 'Failed to load dashboard data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed':
        return 'text-success-600'
      case 'reject':
        return 'text-error-600'
      case 'clarify':
        return 'text-warning-600'
      default:
        return 'text-secondary-600'
    }
  }

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed':
        return t('proceed')
      case 'reject':
        return t('reject')
      case 'clarify':
        return t('clarify')
      default:
        return recommendation
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('dashboard_title')}</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-secondary-600">{t('loading_dashboard')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('dashboard_title')}</h1>
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <h3 className="text-error-800 font-semibold mb-2">{t('error_loading_dashboard')}</h3>
          <p className="text-error-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-3 px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('dashboard_title')}</h1>
        <div className="text-center text-secondary-600">{t('no_data_available')}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-secondary-900 mb-6">{t('dashboard_title')}</h1>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">{t('active_vacancies')}</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.activeVacancies}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">{t('total_candidates')}</h3>
          <p className="text-3xl font-bold text-success-600">{stats.totalCandidates}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">{t('interviews_today')}</h3>
          <p className="text-3xl font-bold text-warning-600">{stats.interviewsToday}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">{t('success_rate')}</h3>
          <p className="text-3xl font-bold text-success-600">{stats.successRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">{t('recent_activity')}</h3>
          {stats.recentActivity.length === 0 ? (
            <p className="text-secondary-500">{t('no_recent_activity')}</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-secondary-900">
                      {activity.first_name && activity.last_name 
                        ? `${activity.first_name} ${activity.last_name}`
                        : activity.username || 'Unknown Candidate'
                      }
                    </p>
                    <p className="text-sm text-secondary-600">{activity.vacancy_title}</p>
                    <p className="text-xs text-secondary-500">{formatActivityTime(activity.created_at)}</p>
                  </div>
                  <div className="text-right">
                    {activity.overall_score !== null && (
                      <p className="font-semibold text-secondary-900">{activity.overall_score}%</p>
                    )}
                    <p className={`text-sm font-medium ${getRecommendationColor(activity.recommendation)}`}>
                      {getRecommendationText(activity.recommendation)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evaluation Distribution */}
        <div className="card">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">{t('evaluation_distribution')}</h3>
          {stats.evaluationDistribution.length === 0 ? (
            <p className="text-secondary-500">{t('no_evaluations_yet')}</p>
          ) : (
            <div className="space-y-3">
              {stats.evaluationDistribution.map((item) => (
                <div key={item.recommendation} className="flex items-center justify-between">
                  <span className={`font-medium ${getRecommendationColor(item.recommendation)}`}>
                    {getRecommendationText(item.recommendation)}
                  </span>
                  <span className="font-bold text-secondary-900">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Average Scores */}
        <div className="card lg:col-span-2">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">{t('average_scores')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{stats.averageScores.avg_overall || 0}%</p>
              <p className="text-sm text-secondary-600">{t('overall')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{stats.averageScores.avg_technical || 0}%</p>
              <p className="text-sm text-secondary-600">{t('technical')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-600">{stats.averageScores.avg_communication || 0}%</p>
              <p className="text-sm text-secondary-600">{t('communication')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-info-600">{stats.averageScores.avg_problem_solving || 0}%</p>
              <p className="text-sm text-secondary-600">{t('problem_solving')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
