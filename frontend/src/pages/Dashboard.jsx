import React, { useState, useEffect } from 'react';

// A custom hook for debouncing input. This is a common pattern in React.
// It helps prevent sending too many API requests while the user is still typing.
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the specified delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes before the delay has passed
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

function DashboardPage({ auth }) {
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for the search input field
    const [searchTerm, setSearchTerm] = useState('');
    // Debounced search term that will be used for the API call
    const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms delay

    const [selectedIds, setSelectedIds] = useState(new Set()); // State to keep track of selected resume IDs

    useEffect(() => {
        const fetchResumes = async () => {
            setIsLoading(true);
            setError('');

            // Construct the URL with the search parameter if it exists
            let url = 'http://localhost:8000/api/resumes/';
            if (debouncedSearchTerm) {
                url += `?search=${encodeURIComponent(debouncedSearchTerm)}`;
            }

            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Token ${auth.token}` },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch resumes.');
                }
                const data = await response.json();
                setResumes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        // This effect will run whenever the debouncedSearchTerm or the auth token changes
        fetchResumes();
    }, [debouncedSearchTerm, auth.token]);

    // --- NEW HANDLERS FOR SELECTION & DELETION ---
    const handleSelect = (id) => {
        const newSelectedIds = new Set(selectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        setSelectedIds(newSelectedIds);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(resumes.map(r => r.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} resume(s)?`)) return;

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

    const handleDownload = async (cvUrl, fileName) => {
        try {
            // --- FIX ---
            // The cvUrl from the backend already contains the full path.
            // We use it directly instead of adding "http://localhost:8000" again.
            const response = await fetch(cvUrl, {
                headers: {
                    'Authorization': `Token ${auth.token}`,
                },
            });
            // --- END OF FIX ---
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Get the file content as a binary large object (blob)
            const blob = await response.blob();
            // Create a temporary URL for this blob in the browser's memory
            const downloadUrl = window.URL.createObjectURL(blob);
            // Create a temporary, invisible link element
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            // Use the original filename for the download
            a.download = fileName.split('/').pop() || 'resume.pdf';
            document.body.appendChild(a);
            // Programmatically click the link to trigger the download
            a.click();
            // Clean up by removing the anchor and revoking the temporary URL
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } catch (err) {
            console.error('Download failed:', err);
            setError('Could not download the file.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Uploaded Resumes</h2>
                <input type="text" placeholder="Search by name or skill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-1/3 px-4 py-2 border border-slate-300 rounded-lg shadow-sm" />
            </div>

            {/* --- NEW DELETE BUTTON & SELECT ALL --- */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-t-lg border-b">
                <div className="flex items-center space-x-3">
                    <input type="checkbox" onChange={handleSelectAll} checked={resumes.length > 0 && selectedIds.size === resumes.length} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                    <label className="text-sm font-medium text-slate-700">Select All</label>
                </div>
                {selectedIds.size > 0 && (
                    <button onClick={handleDeleteSelected} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">
                        Delete Selected ({selectedIds.size})
                    </button>
                )}
            </div>

            <div className="bg-white shadow-xl rounded-b-lg overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {isLoading ? <li className="p-6 text-center">Loading...</li> : resumes.length === 0 ? (
                        <li className="p-6 text-center text-slate-500">{debouncedSearchTerm ? `No results for "${debouncedSearchTerm}".` : 'No resumes uploaded.'}</li>
                    ) : (
                        resumes.map(resume => (
                            <li key={resume.id} className={`p-6 ${selectedIds.has(resume.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <input type="checkbox" checked={selectedIds.has(resume.id)} onChange={() => handleSelect(resume.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                                        <div>
                                            <h3 className="text-xl font-semibold text-blue-700">{resume.name}</h3>
                                            <p className="text-slate-600">{resume.email} | {resume.phone}</p>
                                            <p className="mt-2 text-sm text-slate-500"><strong>Skills:</strong> {resume.skills}</p>
                                        </div>
                                    </div>
                                    {resume.original_cv && <button onClick={() => handleDownload(resume.original_cv)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Download CV</button>}
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
