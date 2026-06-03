import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-white px-6 py-4">
          <h1 className="text-xl font-semibold">Halcyon Capital Partners</h1>
          <p className="text-sm text-primary-light">SENTINEL Onboarding</p>
        </header>
        <main className="p-6">
          <Routes>
            <Route path="/" element={<div>Loading...</div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
