import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <>
      {/* Pasang Mesin Pop-up (Toaster) di sini dengan gaya Enterprise Neo-Academic */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: 'text-sm font-bold text-slate-700 shadow-xl shadow-slate-200/50 border border-slate-100 rounded-2xl tracking-wide px-5 py-3',
          duration: 4000,
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ecfdf5' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#fff1f2' },
          },
        }}
      />

      {/* Daftar Rute tetap berjalan aman di bawahnya */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;