import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import ScrollToTop from './routes/ScrollToTop';
import { Sidebar } from './routes/Sidebar';
import { LabelPage } from './routes/LabelPage';
import { CameraPage } from './routes/CameraPage';
import { TrainPage } from './routes/TrainPage';
import { UsePage } from './routes/UsePage';
import './App.css';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="relative h-screen flex">
        <aside className="fixed top-0 h-screen flex-none w-64 bg-gray-50 dark:bg-gray-800" aria-label="Sidebar">
          <Sidebar />
        </aside>
        <main className="ml-64 grow overflow-y">
          <Routes>
            <Route path="/labels" element={<LabelPage />} />
            <Route path="/labels/:label" element={<LabelPage />} />
            <Route path="/imports/camera" element={<CameraPage />} />
            <Route path="/training" element={<TrainPage />} />
            <Route path="/training/:label" element={<TrainPage />} />
            <Route path="/use" element={<UsePage />} />
            <Route path="/" element={<Navigate to="/labels" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
