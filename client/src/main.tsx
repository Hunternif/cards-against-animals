// Order matters!
// First import Bootstrap styles:
import './scss/styles.scss'
// Then custom styles:
import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage.tsx'
import { ErrorPage } from './pages/ErrorPage.tsx'
import { LobbyPage, lobbyLoader } from './pages/LobbyPage.tsx'
import { WelcomePage } from './pages/WelcomePage.tsx'
import { DecksAdmin } from './pages/admin-screens/DecksAdmin.tsx'
import { LobbiesAdmin } from './pages/admin-screens/LobbiesAdmin.tsx'
import { UploadDeck } from './pages/admin-screens/UploadDeck.tsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/:lobbyID",
    element: <LobbyPage />,
    errorElement: <ErrorPage />,
    loader: lobbyLoader,
  },
  {
    path: "/admin",
    element: <AdminPage />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "lobbies",
        element: <LobbiesAdmin />,
      },
      {
        path: "decks",
        element: <DecksAdmin />,
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
