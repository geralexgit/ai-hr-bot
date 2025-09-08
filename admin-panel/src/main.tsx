import { render } from 'preact'

import { App } from './App'
import './index.css'
import './i18n' // Initialize i18n before rendering

render(
  <>
    <App />
  </>,
  document.getElementById('app')!
)
