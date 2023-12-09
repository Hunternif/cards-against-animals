import './scss/styles.scss'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage.tsx'
import { LobbiesAdmin } from './pages/admin-screens/LobbiesAdmin.tsx'
import { DecksAdmin } from './pages/admin-screens/DecksAdmin.tsx'
import { UploadDeck } from './pages/admin-screens/UploadDeck.tsx'
import { GamePage } from './pages/GamePage.tsx'
import { ErrorPage } from './pages/ErrorPage.tsx'
import { LobbyScreen, lobbyLoader } from './pages/game-screens/LobbyScreen.tsx'
import { LoginScreen } from './pages/game-screens/LoginScreen.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <GamePage />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <LoginScreen />,
      },
      {
        path: "/:lobbyID",
        element: <LobbyScreen />,
        loader: lobbyLoader,
      },
    ],
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
