import { h } from 'preact'
import { Router, Route } from 'preact-router'
import { Dashboard } from './pages/Dashboard'
import { Vacancies } from './pages/Vacancies'
import { AddVacancy } from './pages/AddVacancy'
import { EditVacancy } from './pages/EditVacancy'
import { Candidates } from './pages/Candidates'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Login } from './pages/auth/Login'
import { Layout } from './components/Layout'

export function App() {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Router>
        <Route path="/login" component={Login} />
        <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
        <Route path="/vacancies" component={() => <Layout><Vacancies /></Layout>} />
        <Route path="/vacancies/new" component={() => <Layout><AddVacancy /></Layout>} />
        <Route path="/vacancies/edit/:id" component={() => <Layout><EditVacancy /></Layout>} />
        <Route path="/candidates" component={() => <Layout><Candidates /></Layout>} />
        <Route path="/reports" component={() => <Layout><Reports /></Layout>} />
        <Route path="/settings" component={() => <Layout><Settings /></Layout>} />
      </Router>
    </div>
  )
}
