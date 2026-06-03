import { BrowserRouter } from 'react-router-dom'
import { AppShell } from './AppShell'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <AppShell />
      </div>
    </BrowserRouter>
  )
}

export default App
