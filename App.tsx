import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { UserRole } from './types';
import { Layout } from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import CandidateDashboard from './pages/candidate/Dashboard';
import InterviewPage from './pages/candidate/Interview';
import UploadCV from './pages/candidate/UploadCV';
import CompanyDashboard from './pages/company/Dashboard';
import CompanyProgramDetail from './pages/company/ProgramDetail';
import CreateProgram from './pages/company/CreateProgram';
import AdminDashboard from './pages/admin/Dashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading Serenity...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Candidate Portal */}
        <Route path="/candidate" element={
          <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
            <Layout portal="candidate"><CandidateDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/candidate/interview" element={
          <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
            <Layout portal="candidate"><InterviewPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/candidate/upload-cv" element={
          <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
            <Layout portal="candidate"><UploadCV /></Layout>
          </ProtectedRoute>
        } />

        {/* Company Portal */}
        <Route path="/company" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/company/create-program" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CreateProgram /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/company/programs/:id" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyProgramDetail /></Layout>
          </ProtectedRoute>
        } />

        {/* Admin Portal */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.SERENITY_ADMIN]}>
            <Layout portal="admin"><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}