import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Sidebar } from './features/sidebar/Sidebar';
import { Dataset } from './routes/Dataset';
import { Train } from './routes/Train';
import { Use } from './routes/Use';
import './App.css';

function App() {
  return (
    <Router>
    <div className="flex flex-row min-h-screen">
      <Sidebar />
      <main className="flex flex-col flex-grow">
          <Routes>
            <Route path="/" element={<Dataset />} />
            <Route path="/train" element={<Train />} />
            <Route path="/use" element={<Use />} />
          </Routes>
      </main>
    </div>
    </Router>
  );
}

export default App;
