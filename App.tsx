
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { UserRole } from './types';
import { Layout } from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateApplications from './pages/candidate/MyApplications';
import InterviewPage from './pages/candidate/Interview';
import UploadCV from './pages/candidate/UploadCV';

import CompanyDashboard from './pages/company/Dashboard';
import CompanyProgramDetail from './pages/company/ProgramDetail';
import CompanyCandidateDetail from './pages/company/CandidateDetail';
import CompanyRoleEditor from './pages/company/CreateProgram'; // Reused for Role Editor
import CompanyManageRoles from './pages/company/ManageRoles';

import AdminDashboard from './pages/admin/Dashboard';
import AdminCompanyDetail from './pages/admin/AdminCompanyDetail';
import AdminRoleDetail from './pages/admin/AdminRoleDetail';

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
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        
        {/* Candidate Portal */}
        <Route path="/candidate" element={
          <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
            <Layout portal="candidate"><CandidateDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/candidate/applications" element={
          <ProtectedRoute allowedRoles={[UserRole.CANDIDATE]}>
            <Layout portal="candidate"><CandidateApplications /></Layout>
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
        <Route path="/company/roles" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyManageRoles /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/company/roles/new" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyRoleEditor /></Layout>
          </ProtectedRoute>
        } />
         <Route path="/company/roles/:id/edit" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyRoleEditor /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/company/roles/:id" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyProgramDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/company/applications/:appId" element={
          <ProtectedRoute allowedRoles={[UserRole.COMPANY_USER]}>
            <Layout portal="company"><CompanyCandidateDetail /></Layout>
          </ProtectedRoute>
        } />

        {/* Admin Portal */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[UserRole.SERENITY_ADMIN]}>
            <Layout portal="admin"><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/company/:companyId" element={
          <ProtectedRoute allowedRoles={[UserRole.SERENITY_ADMIN]}>
            <Layout portal="admin"><AdminCompanyDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/role/:roleId" element={
          <ProtectedRoute allowedRoles={[UserRole.SERENITY_ADMIN]}>
            <Layout portal="admin"><AdminRoleDetail /></Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}
