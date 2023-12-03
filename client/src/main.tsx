import './scss/styles.scss'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage.tsx'
import { LobbiesData } from './components/LobbiesData.tsx'
import { DecksData } from './components/DecksData.tsx'
import { UploadDeck } from './components/UploadDeck.tsx'
import { GamePage } from './pages/GamePage.tsx'
import { ErrorPage } from './pages/ErrorPage.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <GamePage />,
    errorElement: <ErrorPage/>
  },
  {
    path: "/admin",
    element: <AdminPage />,
    children: [
      {
        path: "lobbies",
        element: <LobbiesData />,
      },
      {
        path: "decks",
        element: <DecksData />,
      },
      {
        path: "uploadDeck",
        element: <UploadDeck />
      }
    ],
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
