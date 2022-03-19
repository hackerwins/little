import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Sidebar } from './components/sidebar/Sidebar';
import { Label } from './routes/Label';
import { Import } from './routes/Import';
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
            <Route path="/" element={<Label />} />
            <Route path="/import" element={<Import />} />
            <Route path="/train" element={<Train />} />
            <Route path="/use" element={<Use />} />
          </Routes>
      </main>
    </div>
    </Router>
  );
}

export default App;
