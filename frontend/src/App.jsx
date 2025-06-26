// src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import CandidateListPage from './pages/CandidateListPage';
import ManageJobsPage from './pages/ManageJobsPage';
import PublicJobsPage from './pages/PublicJobsPage';
import ApplicationPage from './pages/ApplicationPage';
// --- NEW: Import the EditJobPage ---
import EditJobPage from './pages/EditJobPage';

function App() {
    const auth = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout auth={auth} />}>
                    
                    {/* Public Routes */}
                    <Route index element={<PublicJobsPage />} />
                    <Route path="apply/:jobId" element={<ApplicationPage />} />
                    <Route path="login" element={<LoginPage auth={auth} />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute isAuthenticated={auth.isAuthenticated} />}>
                        <Route path="dashboard" element={<DashboardPage auth={auth} />} />
                        <Route path="dashboard/job/:jobId/candidates" element={<CandidateListPage auth={auth} />} />
                        <Route path="manage-jobs" element={<ManageJobsPage auth={auth} />} />
                        {/* --- NEW: Route for editing a specific job --- */}
                        <Route path="edit-job/:jobId" element={<EditJobPage auth={auth} />} />
                    </Route>
                    
                    <Route path="*" element={<div className="text-center"><h2>Page Not Found!</h2></div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
