/**
 * App.jsx — Root Application with Routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LightningShare from './pages/LightningShare';
import SecureVault from './pages/SecureVault';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/lightning"  element={<LightningShare />} />
          <Route path="/vault"      element={<SecureVault />} />
          <Route path="/vault/:id"  element={<SecureVault />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
