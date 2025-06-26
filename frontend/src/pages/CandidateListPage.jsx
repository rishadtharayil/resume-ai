import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ScorecardModal from '../components/ScorecardModal';

// --- NEW: Component for the status dropdown ---
const StatusSelector = ({ currentStatus, resumeId, onStatusChange }) => {
    const STATUS_CHOICES = ['New', 'Under Review', 'Interviewing', 'Offer', 'Hired', 'Rejected'];
    
    const statusColorMap = {
        'New': 'bg-blue-100 text-blue-800',
        'Under Review': 'bg-yellow-100 text-yellow-800',
        'Interviewing': 'bg-purple-100 text-purple-800',
        'Offer': 'bg-pink-100 text-pink-800',
        'Hired': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
    };

    return (
        <select
            value={currentStatus}
            onChange={(e) => onStatusChange(resumeId, e.target.value)}
            className={`text-xs font-medium border-none rounded-full px-2 py-1 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusColorMap[currentStatus] || 'bg-slate-100 text-slate-800'}`}
            onClick={(e) => e.stopPropagation()} // Prevent row click when changing status
        >
            {STATUS_CHOICES.map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
        </select>
    );
};

function CandidateListPage({ auth }) {
    const { jobId } = useParams();
    const [jobTitle, setJobTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewingScorecardFor, setViewingScorecardFor] = useState(null);
    const [sortBy, setSortBy] = useState('-score');
    const [resumesData, setResumesData] = useState({ results: [], count: 0, next: null, previous: null });
    
    // --- FIX: Add state to track the current page number ---
    const [currentPage, setCurrentPage] = useState(1);

    const fetchCandidates = async (url) => {
        if (!jobId) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Token ${auth.token}` } });
            if (!response.ok) throw new Error('Failed to fetch candidates.');
            const data = await response.json();
            setResumesData(data);
            if (!jobTitle) {
                const jobResponse = await fetch(`http://localhost:8000/api/jobs/${jobId}/`, { headers: { 'Authorization': `Token ${auth.token}` } });
                if (!jobResponse.ok) throw new Error('Failed to fetch job details.');
                const jobData = await jobResponse.json();
                setJobTitle(jobData.title);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (auth.token) {
            // --- FIX: Reset to page 1 when sorting changes ---
            setCurrentPage(1);
            const initialUrl = `http://localhost:8000/api/resumes/?job_id=${jobId}&sort_by=${sortBy}&page=1`;
            fetchCandidates(initialUrl);
        }
    }, [jobId, auth.token, sortBy]);

    const handlePageChange = (url, direction) => {
         if (!url) return;
         fetchCandidates(url);
         // --- FIX: Update current page state based on direction ---
         if(direction === 'next') {
            setCurrentPage(prev => prev + 1);
         } else if (direction === 'previous') {
            setCurrentPage(prev => prev - 1);
         }
    };

    const handleStatusChange = async (resumeId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:8000/api/resumes/${resumeId}/update-status/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${auth.token}` },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update status.');
            const updatedResume = await response.json();

            setResumesData(currentData => ({
                ...currentData,
                results: currentData.results.map(resume => 
                    resume.id === resumeId ? updatedResume : resume
                )
            }));

        } catch (err) {
            setError(err.message);
        }
    };

    const handleSelect = (id) => {
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id);
        setSelectedIds(newSelectedIds);
    };
    
    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? new Set(resumesData.results.map(r => r.id)) : new Set());
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0 || !window.confirm(`Are you sure you want to delete ${selectedIds.size} applicant(s)?`)) return;
        try {
            await fetch('http://localhost:8000/api/resumes/delete/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${auth.token}` },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            const initialUrl = `http://localhost:8000/api/resumes/?job_id=${jobId}&sort_by=${sortBy}&page=${currentPage}`;
            fetchCandidates(initialUrl);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        }
    };

    // --- ADDED: handleDownload function ---
    const handleDownload = async (cvUrl) => {
        try {
            const response = await fetch(cvUrl, { headers: { 'Authorization': `Token ${auth.token}` } });
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = cvUrl.split('/').pop() || 'resume.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } catch (err) {
            setError('Could not download the file.');
        }
    };

    const totalPages = Math.ceil(resumesData.count / 10);

    return (
        <>
            <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <Link to="/dashboard" className="text-slate-500 hover:text-indigo-600">&larr; Back to Jobs</Link>
                            <h2 className="text-2xl font-bold text-slate-800">Applicants for: {jobTitle}</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                             <label htmlFor="sort" className="text-sm font-medium text-slate-600">Sort by:</label>
                             <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-slate-300 rounded-md p-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                                 <option value="-score">Highest Score</option>
                                 <option value="-uploaded_on">Newest First</option>
                                 <option value="name">Name (A-Z)</option>
                             </select>
                        </div>
                    </div>
                </div>

                {resumesData.results.length > 0 && (
                     <div className="p-4 bg-slate-50/50 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input type="checkbox" onChange={handleSelectAll} checked={resumesData.results.length > 0 && selectedIds.size === resumesData.results.length} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/>
                                <label className="text-sm font-medium text-slate-600">Select All</label>
                            </div>
                            {selectedIds.size > 0 && (
                                <button onClick={handleDeleteSelected} className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700">
                                    Delete Selected ({selectedIds.size})
                                </button>
                            )}
                        </div>
                    </div>
                )}
               
                <div>
                     <ul className="divide-y divide-slate-200">
                        {isLoading ? <li className="p-6 text-center text-slate-500">Loading Candidates...</li> : error ? <li className="p-6 text-center text-red-600">{error}</li> : resumesData.results.length === 0 ? (
                            <li className="p-6 text-center text-slate-500">No applicants for this job yet.</li>
                        ) : (
                            resumesData.results.map(resume => (
                                <li key={resume.id} className={`p-4 ${selectedIds.has(resume.id) ? 'bg-indigo-50' : 'hover:bg-slate-50/50'}`}>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-1 flex items-center">
                                           <input type="checkbox" checked={selectedIds.has(resume.id)} onChange={() => handleSelect(resume.id)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/>
                                        </div>
                                        <div className="col-span-4">
                                            <p className="font-semibold text-slate-800">{resume.name}</p>
                                            <p className="text-sm text-slate-500">{resume.email}</p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className="font-bold text-lg text-slate-700">{resume.scorecard_data?.match_score?.toFixed(1) || 'N/A'}</span>
                                            <span className="text-sm text-slate-500"> / 10</span>
                                        </div>
                                        <div className="col-span-2">
                                            <StatusSelector currentStatus={resume.status} resumeId={resume.id} onStatusChange={handleStatusChange} />
                                        </div>
                                        <div className="col-span-3 flex justify-end space-x-2">
                                            <button onClick={() => setViewingScorecardFor(resume)} className="px-3 py-1.5 text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors">Scorecard</button>
                                            {/* --- ADDED: Download CV Button --- */}
                                            {resume.original_cv && <button onClick={() => handleDownload(resume.original_cv)} className="px-3 py-1.5 bg-green-600 text-white text-xs hover:bg-green-700 rounded-md">CV</button>}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
                {resumesData.count > 0 && (
                    <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                             {/* --- FIX: Use currentPage state for display --- */}
                             Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        </p>
                        <div className="flex space-x-2">
                            <button onClick={() => handlePageChange(resumesData.previous, 'previous')} disabled={!resumesData.previous} className="px-3 py-1.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                                Previous
                            </button>
                            <button onClick={() => handlePageChange(resumesData.next, 'next')} disabled={!resumesData.next} className="px-3 py-1.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {viewingScorecardFor && (
                <ScorecardModal 
                    resume={viewingScorecardFor} 
                    onClose={() => setViewingScorecardFor(null)} 
                />
            )}
        </>
    );
}

export default CandidateListPage;
