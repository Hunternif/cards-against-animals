import './scss/styles.scss'

import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AdminPage } from './pages/AdminPage.tsx'
import { ErrorPage } from './pages/ErrorPage.tsx'
import { LobbyPage, lobbyLoader } from './pages/LobbyPage.tsx'
import { WelcomePage } from './pages/WelcomePage.tsx'
import { RewindPage } from './pages/RewindPage.tsx'
import { AdminDecksPage } from './pages/admin-screens/AdminDecksPage.tsx'
import { AdminLobbiesPage } from './pages/admin-screens/AdminLobbiesPage.tsx'
import { AdminUploadDeckPage } from './pages/admin-screens/AdminUploadDeckPage.tsx'
import { AdminUploadDeckTsvPage } from './pages/admin-screens/AdminUploadDeckTsvPage.tsx'
import { AdminStatsPage } from './pages/admin-screens/AdminStatsPage.tsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/rewind",
    element: <RewindPage />,
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
        element: <AdminLobbiesPage />,
      },
      {
        path: "decks",
        element: <AdminDecksPage />,
      },
      {
        path: "uploadDeck",
        element: <AdminUploadDeckPage />
      },
      {
        path: "uploadDeckTsv",
        element: <AdminUploadDeckTsvPage />
      },
      {
        path: "stats",
        element: <AdminStatsPage />
      }
    ],
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
