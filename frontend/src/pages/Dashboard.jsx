import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function DashboardPage({ auth }) {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch('http://localhost:8000/api/jobs/', {
                    headers: { 'Authorization': `Token ${auth.token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch job postings.');
                }
                const data = await response.json();
                // --- FIX: Access the .results array from the paginated response ---
                setJobs(data.results);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (auth.token) {
            fetchJobs();
        }
    }, [auth.token]);

    const handleDelete = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Token ${auth.token}` }
            });

            if (response.status !== 204) {
                throw new Error('Failed to delete the job posting.');
            }
            
            setJobs(jobs.filter(job => job.id !== jobId));

        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800">Job Postings</h2>
                    <Link 
                        to="/manage-jobs"
                        className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                        Create New Job
                    </Link>
                </div>
            </div>
            
            <div>
                <ul className="divide-y divide-slate-200">
                    {isLoading ? (
                        <li className="p-6 text-center text-slate-500">Loading Jobs...</li>
                    ) : error ? (
                        <li className="p-6 text-center text-red-600">{error}</li>
                    ) : jobs.length === 0 ? (
                        <li className="p-6 text-center text-slate-500">
                            You haven't posted any jobs yet.
                        </li>
                    ) : (
                        jobs.map(job => (
                            <li key={job.id} className="p-4 group hover:bg-slate-50/50">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div 
                                        className="col-span-8 cursor-pointer"
                                        onClick={() => navigate(`/dashboard/job/${job.id}/candidates`)}
                                    >
                                        <p className="font-semibold text-slate-800 group-hover:text-indigo-600">{job.title}</p>
                                        <p className="text-sm text-slate-500 truncate">
                                            {job.description}
                                        </p>
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <div className="flex items-center justify-end space-x-3">
                                            <button 
                                                onClick={() => navigate(`/edit-job/${job.id}`)}
                                                className="text-sm font-medium text-slate-500 hover:text-indigo-600"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(job.id)}
                                                className="text-sm font-medium text-slate-500 hover:text-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}

export default DashboardPage;
