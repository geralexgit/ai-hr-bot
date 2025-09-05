import { h } from 'preact'

export function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-secondary-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Active Vacancies</h3>
          <p className="text-3xl font-bold text-primary-600">12</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Total Candidates</h3>
          <p className="text-3xl font-bold text-success-600">156</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Interviews Today</h3>
          <p className="text-3xl font-bold text-warning-600">8</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-success-600">73%</p>
        </div>
      </div>
    </div>
  )
}
