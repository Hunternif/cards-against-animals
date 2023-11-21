import { useState } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { lobbiesRef } from './firebase'

function App() {
  const [count, setCount] = useState(0)
  const [lobbies] = useCollection(lobbiesRef);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <h2>Lobbies</h2>
      <ul>
      {lobbies && lobbies.docs.map((doc) => (
        <li>{doc.id}: {doc.data()['lobby_key']}</li>
      ))}
      </ul>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
