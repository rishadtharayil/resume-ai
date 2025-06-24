import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ManageJobsPage({ auth }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch('http://localhost:8000/api/jobs/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${auth.token}`
                },
                body: JSON.stringify({ title, description })
            });

            if (!response.ok) {
                throw new Error('Failed to create job posting.');
            }

            setSuccess('Job posting created successfully! Redirecting to dashboard...');
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Create a New Job Posting</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center bg-green-100 p-2 rounded-md">{success}</p>}
                    
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Job Title</label>
                        <input 
                            type="text" 
                            id="title"
                            value={title} 
                            onChange={e => setTitle(e.target.value)}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            required 
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Job Description</label>
                        <textarea 
                            id="description"
                            value={description} 
                            onChange={e => setDescription(e.target.value)}
                            rows={10}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" 
                            placeholder="Paste the full job description here..."
                            required 
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button 
                            type="button" 
                            onClick={() => navigate('/dashboard')}
                            className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Create Job
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ManageJobsPage;
