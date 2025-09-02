import { h } from 'preact'
import { Router, Route } from 'preact-router'
import { Dashboard } from './pages/Dashboard'
import { Vacancies } from './pages/Vacancies'
import { Candidates } from './pages/Candidates'
import { Reports } from './pages/Reports'
import { Login } from './pages/auth/Login'
import { Layout } from './components/Layout'

export function App() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Router>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
        <Route path="/vacancies" component={() => <Layout><Vacancies /></Layout>} />
        <Route path="/candidates" component={() => <Layout><Candidates /></Layout>} />
        <Route path="/reports" component={() => <Layout><Reports /></Layout>} />
      </Router>
    </div>
  )
}
