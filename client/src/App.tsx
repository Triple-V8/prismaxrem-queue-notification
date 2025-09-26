import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import QueueStatus from './components/QueueStatus';
import ReminderForm from './components/ReminderForm';
import UserDashboard from './components/UserDashboard';
import Footer from './components/Footer';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          PrismaX Queue Monitor
        </Link>
        <ul className="nav-links">
          <li>
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Register
            </Link>
          </li>
          {/* <li>
            <Link to="/queue-status" className={location.pathname === '/queue-status' ? 'active' : ''}>
              Queue Status
            </Link>
          </li>
          <li>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
          </li> */}
        </ul>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="fade-in">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<ReminderForm />} />
            <Route path="/queue-status" element={<QueueStatus />} />
            <Route path="/dashboard" element={<UserDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;