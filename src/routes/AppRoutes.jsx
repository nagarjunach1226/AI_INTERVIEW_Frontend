import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import SystemCheckPage from '../pages/SystemCheckPage';
import InterviewPage from '../pages/InterviewPage';
// Temporary placeholder component for routes not yet implemented
const PlaceholderPage = ({ pageName }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-[#0c1c17] mb-4">{pageName} Page</h1>
      <p className="text-[#46a080]">This page is under construction.</p>
    </div>
  </div>
);

// const SystemCheckPage = () => <PlaceholderPage pageName="System Check" />;
const ForgotPasswordPage = () => <PlaceholderPage pageName="Forgot Password" />;

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/system-check" element={<SystemCheckPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;