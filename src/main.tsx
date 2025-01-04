import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import AuthCallback from './components/AuthCallback';
import './index.css';

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="/posts" element={<PostList />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
