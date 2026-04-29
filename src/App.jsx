import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import InstallPrompt from './components/InstallPrompt';
import FormFill from './pages/FormFill';
import Dashboard from './pages/Dashboard';
import Records from './pages/Records';
import AskOwl from './pages/AskOwl';
import Admin from './pages/Admin';
import Header from './components/Header';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
          setIsAdmin(adminDoc.exists());
        } catch (e) {
          console.error("Error checking admin status:", e);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-primary">טוען...</div>;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground font-heebo">
        <Header user={user} isAdmin={isAdmin} />
        <InstallPrompt />
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<FormFill />} />
            <Route path="/dashboard" element={isAdmin ? <Dashboard /> : <Navigate to="/admin" />} />
            <Route path="/records" element={isAdmin ? <Records /> : <Navigate to="/admin" />} />
            <Route path="/ask-owl" element={isAdmin ? <AskOwl /> : <Navigate to="/admin" />} />
            <Route path="/admin" element={<Admin isAdmin={isAdmin} user={user} />} />
          </Routes>
        </main>
        <BottomNav isAdmin={isAdmin} />
      </div>
    </BrowserRouter>
  );
}

export default App;
