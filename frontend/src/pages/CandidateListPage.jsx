import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ScorecardModal from '../components/ScorecardModal';

function CandidateListPage({ auth }) {
    const { jobId } = useParams(); // Get the job ID from the URL
    const [resumes, setResumes] = useState([]);
    const [jobTitle, setJobTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewingScorecardFor, setViewingScorecardFor] = useState(null);

    useEffect(() => {
        const fetchCandidates = async () => {
            if (!jobId) return;
            setIsLoading(true);
            setError('');

            try {
                // Fetch candidates for the specific job
                const resumeResponse = await fetch(`http://localhost:8000/api/resumes/?job_id=${jobId}`, {
                    headers: { 'Authorization': `Token ${auth.token}` }
                });
                if (!resumeResponse.ok) throw new Error('Failed to fetch candidates.');
                const resumeData = await resumeResponse.json();
                setResumes(resumeData);

                // Fetch job details to display the title
                const jobResponse = await fetch(`http://localhost:8000/api/jobs/${jobId}/`, {
                    headers: { 'Authorization': `Token ${auth.token}` }
                });
                if (!jobResponse.ok) throw new Error('Failed to fetch job details.');
                const jobData = await jobResponse.json();
                setJobTitle(jobData.title);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (auth.token) {
            fetchCandidates();
        }
    }, [jobId, auth.token]);

    const handleSelect = (id) => {
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id);
        setSelectedIds(newSelectedIds);
    };
    
    // --- NEW: Select All and Delete Handlers ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(resumes.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0 || !window.confirm(`Are you sure you want to delete ${selectedIds.size} applicant(s)?`)) {
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/resumes/delete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${auth.token}`
                },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            if (!response.ok) {
                throw new Error('Failed to delete applicants.');
            }

            setResumes(prev => prev.filter(r => !selectedIds.has(r.id)));
            setSelectedIds(new Set()); // Clear selection

        } catch (err) {
            setError(err.message);
        }
    };

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


    return (
        <>
            <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-4">
                        <Link to="/dashboard" className="text-slate-500 hover:text-indigo-600">
                           &larr; Back to Jobs
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-800">Applicants for: {jobTitle}</h2>
                    </div>
                </div>

                {/* --- NEW: Selection and Deletion Bar --- */}
                {resumes.length > 0 && (
                     <div className="p-4 bg-slate-50/50 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <input type="checkbox" onChange={handleSelectAll} checked={resumes.length > 0 && selectedIds.size === resumes.length} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/>
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
                        {isLoading ? <li className="p-6 text-center text-slate-500">Loading Candidates...</li> : error ? <li className="p-6 text-center text-red-600">{error}</li> : resumes.length === 0 ? (
                            <li className="p-6 text-center text-slate-500">No applicants for this job yet.</li>
                        ) : (
                            resumes.map(resume => (
                                <li key={resume.id} className={`p-4 ${selectedIds.has(resume.id) ? 'bg-indigo-50' : 'hover:bg-slate-50/50'}`}>
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                         <div className="col-span-1 flex items-center">
                                           <input type="checkbox" checked={selectedIds.has(resume.id)} onChange={() => handleSelect(resume.id)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"/>
                                        </div>
                                        <div className="col-span-5">
                                            <p className="font-semibold text-slate-800">{resume.name}</p>
                                            <p className="text-sm text-slate-500">{resume.email}</p>
                                        </div>
                                        <div className="col-span-3 text-center">
                                            <span className="font-bold text-lg text-slate-700">{resume.scorecard_data?.match_score?.toFixed(1) || 'N/A'}</span>
                                            <span className="text-sm text-slate-500"> / 10 Match</span>
                                        </div>
                                        <div className="col-span-3 flex justify-end space-x-2">
                                            <button onClick={() => setViewingScorecardFor(resume)} className="px-3 py-1.5 text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md transition-colors">View Scorecard</button>
                                            {resume.original_cv && <button onClick={() => handleDownload(resume.original_cv)} className="px-3 py-1.5 bg-green-600 text-white text-xs hover:bg-green-700 rounded-md">CV</button>}
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
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
