import { Routes, Route } from 'react-router-dom';
import { PlayerApp } from './pages/player/PlayerApp.js';
import { AdminApp } from './pages/admin/AdminApp.js';
import { Display } from './pages/display/Display.js';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PlayerApp />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/display" element={<Display />} />
      <Route path="*" element={<div className="page"><h1>Not Found</h1></div>} />
    </Routes>
  );
}
