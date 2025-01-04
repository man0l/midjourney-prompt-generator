import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { Routes, Route } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import PostList from './components/PostList'
import PostDetail from './components/PostDetail'
import AuthCallback from './components/AuthCallback'

export function render(url: string) {
  return ReactDOMServer.renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<HomePage />} />
            <Route path="/posts" element={<PostList />} />
            <Route path="/posts/:slug" element={<PostDetail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Route>
        </Routes>
      </StaticRouter>
    </React.StrictMode>
  )
} 