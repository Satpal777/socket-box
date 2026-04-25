import { useState, useEffect } from 'react'
import CheckboxGrid from './components/CheckboxGrid'

function App() {
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`)

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userId)}`

  return (
    <div className="app">
      <header>
        <h1>Checkbox Selection Grid</h1>
        <img src={avatarUrl} alt="Your avatar" className="header-avatar" />
      </header>
      <main>
        <CheckboxGrid userId={userId} />
      </main>
    </div>
  )
}

export default App
