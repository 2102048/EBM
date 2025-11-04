
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import CustomerDashboard from './components/CustomerDashboard';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <h1>Electricity Bill Management System</h1>
          {user && (
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          )}
        </header>
        <main>
          <Routes>
            <Route 
              path="/login" 
              element={
                !user ? <LoginPage onLogin={setUser} /> : <Navigate to="/" />
              }
            />
            <Route 
              path="/" 
              element={
                !user ? <Navigate to="/login" /> : (
                  user.role === 'admin' ? <AdminDashboard user={user} /> : <CustomerDashboard user={user} />
                )
              }
            />
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;