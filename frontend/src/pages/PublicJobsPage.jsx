import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// A new modal component for viewing the full job description
const JobDetailModal = ({ job, onClose }) => {
    if (!job) return null;
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="w-full max-w-2xl max-h-[80vh] bg-white rounded-xl shadow-lg p-8 overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-bold text-slate-800">{job.title}</h2>
                    <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <div className="mt-4 prose max-w-none">
                    <p className="whitespace-pre-wrap text-slate-600">{job.description}</p>
                </div>
            </div>
        </div>
    );
};

/**
 * This page now serves as the public job board, displaying all available job
 * postings for applicants to view and apply for.
 */
function PublicJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingJob, setViewingJob] = useState(null); // State for the modal
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch the list of all job postings.
                // This endpoint must be made public on the backend.
                const response = await fetch('http://localhost:8000/api/jobs/');
                if (!response.ok) {
                    throw new Error('Could not fetch job postings. Please try again later.');
                }
                const data = await response.json();
                setJobs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJobs();
    }, []);

    return (
        <>
            <div className="max-w-4xl mx-auto">
                 <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Find Your Next Opportunity</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">Browse our open positions and apply to the role that fits you best. Our AI will help match you with the perfect job.</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                         <h2 className="text-2xl font-bold text-slate-800">Open Positions</h2>
                    </div>
                    <div>
                        {error && <div className="p-6 text-center text-red-600">{error}</div>}
                        {isLoading ? (
                            <div className="p-6 text-center text-slate-500">Loading jobs...</div>
                        ) : (
                            <ul className="divide-y divide-slate-200">
                               {jobs.length > 0 ? jobs.map(job => (
                                   <li key={job.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                           <div className="md:col-span-3">
                                                <h3 className="text-xl font-semibold text-indigo-700">{job.title}</h3>
                                                <p className="text-slate-500 mt-2 line-clamp-2">{job.description}</p>
                                           </div>
                                           <div className="md:col-span-1 md:text-right flex md:flex-col items-center justify-end space-x-2 md:space-x-0 md:space-y-2">
                                                <button 
                                                    onClick={() => setViewingJob(job)}
                                                    className="w-full md:w-auto text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                                >
                                                    View More
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/apply/${job.id}`)}
                                                    className="w-full md:w-auto bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                                >
                                                    Apply Now
                                                </button>
                                           </div>
                                       </div>
                                   </li>
                               )) : (
                                   <li className="p-6 text-center text-slate-500">No open positions at the moment. Please check back later!</li>
                               )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Render the modal when a job is selected for viewing */}
            <JobDetailModal job={viewingJob} onClose={() => setViewingJob(null)} />
        </>
    );
}

export default PublicJobsPage;
