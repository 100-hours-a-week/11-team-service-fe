import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
// import { Toaster } from 'react-hot-toast'; // Optional: for toast notifications if we add them later

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        {/* <Toaster /> */}
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
