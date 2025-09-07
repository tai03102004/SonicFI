import React from 'react';
import { BrowserRouter as Router} from 'react-router-dom';

import MainDashboard from './components/MainDashboard';
import './styles/optimized.css';


const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <MainDashboard />
      </div>
    </Router>
  );
};

export default App;