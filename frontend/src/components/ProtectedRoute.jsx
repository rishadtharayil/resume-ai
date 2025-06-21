import { Navigate, Outlet } from 'react-router-dom';    

// --- A wrapper for routes that require a logged-in user ---
function ProtectedRoute({ isAuthenticated }) {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
}

export default ProtectedRoute;