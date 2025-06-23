import React, { useState, useEffect } from 'react';
import ScorecardModal from '../components/ScorecardModal';

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

function DashboardPage({ auth }) {
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewingScorecardFor, setViewingScorecardFor] = useState(null);

    useEffect(() => {
        const fetchResumes = async () => {
            setIsLoading(true);
            setError('');
            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            const url = `http://localhost:8000/api/resumes/?${params.toString()}`;

            try {
                const response = await fetch(url, { headers: { 'Authorization': `Token ${auth.token}` } });
                if (!response.ok) {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const errorData = await response.json();
                        throw new Error(errorData.detail || 'Failed to fetch resumes.');
                    } else {
                        throw new Error(`Server returned a non-JSON error (Status: ${response.status})`);
                    }
                }
                let data = await response.json();
                setResumes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchResumes();
    }, [debouncedSearchTerm, auth.token]);

    const handleSelect = (id) => {
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id);
        setSelectedIds(newSelectedIds);
    };

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? new Set(resumes.map(r => r.id)) : new Set());

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0 || !window.confirm(`Are you sure you want to delete ${selectedIds.size} resume(s)?`)) return;
        try {
            const response = await fetch('http://localhost:8000/api/resumes/delete/', {
                method: 'POST',
                headers: { 'Authorization': `Token ${auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
            });
            if (!response.ok) throw new Error('Failed to delete resumes.');
            setResumes(prev => prev.filter(r => !selectedIds.has(r.id)));
            setSelectedIds(new Set());
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
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">Candidate Dashboard</h2>
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-1/3 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                </div>

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

                <div>
                    <ul className="divide-y divide-slate-200">
                        {isLoading ? <li className="p-6 text-center text-slate-500">Loading Candidates...</li> : error ? <li className="p-6 text-center text-red-600">{error}</li> : resumes.length === 0 ? (
                            <li className="p-6 text-center text-slate-500">{debouncedSearchTerm ? `No results for "${debouncedSearchTerm}".` : 'No resumes uploaded yet.'}</li>
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
                                            <span className="font-bold text-lg text-slate-700">{resume.scorecard_data?.overall_score?.toFixed(1) || 'N/A'}</span>
                                            <span className="text-sm text-slate-500"> / 10</span>
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

export default DashboardPage;

