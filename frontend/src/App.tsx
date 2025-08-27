import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components for better performance
const SimpleResearchDashboard = lazy(() => import('./components/SimpleResearchDashboard'));
const AdvancedAnalytics = lazy(() => import('./components/AdvancedAnalytics'));
const AIModelMarketplace = lazy(() => import('./components/advanced/AIModelMarketplace'));
const ReputationDashboard = lazy(() => import('./components/advanced/ReputationDashboard'));

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
        <Navigation />
        <main>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<SimpleResearchDashboard />} />
              <Route path="/analytics" element={<AdvancedAnalytics />} />
              <Route path="/ai-models" element={<AIModelMarketplace />} />
              <Route path="/reputation" element={<ReputationDashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
};

export default App;
