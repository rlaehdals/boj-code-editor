import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CodeEditor from './CodeEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CodeEditor />} />
      </Routes>
    </Router>
  );
}

export default App;