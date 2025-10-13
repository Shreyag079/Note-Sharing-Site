import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EncryptForm from './components/EncryptForm';
import DecryptMessage from './components/DecryptMessage';

export default function App(){
  return (
    <Router>
      <Routes>
        <Route path='/' element={<EncryptForm />} />
        <Route path='/retrieve/:id' element={<DecryptMessage />} />
      </Routes>
    </Router>
  );
}