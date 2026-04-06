import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Journal from './pages/Journal';
import ViewEntry from './pages/ViewEntry';
import Settings from './pages/Settings';
import Reflections from './pages/Reflections';
import Support from './pages/Support';
import Guides from './pages/Guides';
import { Privacy, Terms, Popi } from './pages/Legal';
import { SettingsProvider } from './contexts/SettingsContext';
import NotFound from './pages/NotFound';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/reflections" element={<Reflections />} />
          <Route path="/journal/view/:id" element={<ViewEntry />} />
          <Route path="/journal/settings" element={<Settings />} />
          <Route path="/journal/guides" element={<Guides />} />
          <Route path="/journal/support" element={<Support />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/popi" element={<Popi />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

export default App;
