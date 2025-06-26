import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';

function LoginPage({ auth }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('http://localhost:8000/api/api-token-auth/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) throw new Error('Invalid username or password.');
            const data = await response.json();
            auth.login(data.token);
        } catch (err) {
            setError(err.message);
        }
    };

    if (auth.isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Employer Login</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                               className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                               className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
