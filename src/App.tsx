import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Sidebar } from './routes/Sidebar';
import { LabelPage } from './routes/LabelPage';
import { CameraPage } from './routes/CameraPage';
import { TrainPage } from './routes/TrainPage';
import { UsePage } from './routes/UsePage';
import './App.css';

function App() {
  return (
    <Router>
    <div className="flex flex-row min-h-screen">
      <Sidebar />
      <main className="flex flex-col flex-grow">
          <Routes>
            <Route path="/labels" element={<LabelPage />} />
            <Route path="/labels/camera" element={<CameraPage />} />
            <Route path="/train" element={<TrainPage />} />
            <Route path="/use" element={<UsePage />} />
            <Route path="/" element={<Navigate to="/labels" />} />
          </Routes>
      </main>
    </div>
    </Router>
  );
}

export default App;
