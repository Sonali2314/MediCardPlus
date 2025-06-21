import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
//import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';

import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <div className="app-container">
//           <Navbar />
//           <main className="main-content"> 
//             <AppRoutes />
//           </main> 
//           <Footer />
//           <ToastContainer position="top-right" autoClose={3000} />
//         </div>
//       </AuthProvider>
//     </Router>
//   );
// }
function App() {
  return (
    <AuthProvider>
      <div className="app-container">
      <Router>
        <AppRoutes />
      </Router>
      </div>
    </AuthProvider>
  );
}
export default App;