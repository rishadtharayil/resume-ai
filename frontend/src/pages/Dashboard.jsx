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
                setJobs(data);
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
                            <li key={job.id} className="p-4 hover:bg-slate-50/50">
                                <div 
                                    className="grid grid-cols-12 gap-4 items-center cursor-pointer"
                                    onClick={() => navigate(`/dashboard/job/${job.id}/candidates`)}
                                >
                                    <div className="col-span-8">
                                        <p className="font-semibold text-slate-800">{job.title}</p>
                                        <p className="text-sm text-slate-500 truncate">
                                            {job.description}
                                        </p>
                                    </div>
                                    <div className="col-span-4 text-right">
                                        <span className="text-xs text-slate-400">
                                            Posted on: {new Date(job.created_at).toLocaleDateString()}
                                        </span>
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
