import React, { useState, useEffect } from 'react';

// A helper component to display the star rating
const StarRating = ({ rating }) => {
    const totalStars = 10;
    const filledStars = Math.round(rating);
    
    // Simple way to handle null or undefined ratings
    if (rating === null || rating === undefined) {
        return <div className="text-sm text-slate-400">No rating</div>;
    }

    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, index) => (
                <svg
                    key={index}
                    className={`w-5 h-5 ${index < filledStars ? 'text-amber-400' : 'text-slate-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.956a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.287 3.956c.3.921-.755 1.688-1.54 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.54-1.118l1.287-3.956a1 1 0 00-.364-1.118L2.07 9.383c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
                </svg>
            ))}
            <span className="ml-2 text-slate-600 font-bold text-sm">({rating.toFixed(1)}/10)</span>
        </div>
    );
};


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

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        const fetchResumes = async () => {
            setIsLoading(true);
            setError('');

            const params = new URLSearchParams();
            if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
            if (selectedCategory) params.append('category', selectedCategory);
            
            const url = `http://localhost:8000/api/resumes/?${params.toString()}`;

            try {
                const response = await fetch(url, {
                    headers: { 'Authorization': `Token ${auth.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch resumes.');
                let data = await response.json();

                if (selectedCategory) {
                    data.sort((a, b) => {
                        const aIsPrimary = a.categories && a.categories[0] === selectedCategory;
                        const bIsPrimary = b.categories && b.categories[0] === selectedCategory;
                        if (aIsPrimary && !bIsPrimary) return -1;
                        if (!aIsPrimary && bIsPrimary) return 1;
                        return 0;
                    });
                }
                
                setResumes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchResumes();
    }, [debouncedSearchTerm, selectedCategory, auth.token]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/categories/', {
                    headers: { 'Authorization': `Token ${auth.token}` },
                });
                if (!response.ok) throw new Error('Failed to fetch categories.');
                const data = await response.json();
                setCategories(data);
            } catch (err) {
                console.error("Category fetch error:", err);
            }
        };

        if (auth.token) {
            fetchCategories();
        }
    }, [auth.token]);


    const handleSelect = (id) => {
        const newSelectedIds = new Set(selectedIds);
        newSelectedIds.has(id) ? newSelectedIds.delete(id) : newSelectedIds.add(id);
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
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} resume(s)?`)) {
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
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Uploaded Resumes</h2>
                <input type="text" placeholder="Search by name or skill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-1/3 px-4 py-2 border border-slate-300 rounded-lg shadow-sm" />
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700 mr-2">Filter by Category:</span>
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border'}`}
                >
                    All Resumes
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

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
                    {isLoading ? <li className="p-6 text-center">Loading...</li> : error ? <li className="p-6 text-center text-red-500">{error}</li> : resumes.length === 0 ? (
                        <li className="p-6 text-center text-slate-500">{selectedCategory ? `No resumes found in the "${selectedCategory}" category.` : (debouncedSearchTerm ? `No results for "${debouncedSearchTerm}".` : 'No resumes uploaded.')}</li>
                    ) : (
                        resumes.map(resume => (
                            <li key={resume.id} className={`p-6 ${selectedIds.has(resume.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start space-x-4 w-full">
                                        <input type="checkbox" checked={selectedIds.has(resume.id)} onChange={() => handleSelect(resume.id)} className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1"/>
                                        <div className="w-full">
                                            {/* --- MODIFIED: Added Rating Display --- */}
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-semibold text-blue-700">{resume.name}</h3>
                                                <StarRating rating={resume.rating} />
                                            </div>
                                            <p className="text-slate-600 text-sm">{resume.email} | {resume.phone}</p>
                                            
                                            <div className="mt-4 space-y-3">
                                                {resume.categories && resume.categories.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">Primary Role:</p>
                                                        <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                                            {resume.categories[0]}
                                                        </span>
                                                    </div>
                                                )}

                                                {resume.categories && resume.categories.length > 1 && (
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">Other Suitable Roles:</p>
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {resume.categories.slice(1).map(cat => (
                                                                <span key={cat} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                                    {cat}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {resume.skills && (
                                                     <div>
                                                        <p className="text-sm font-semibold text-slate-800">Top Skills:</p>
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {resume.skills.split(',').map(skill => skill.trim()).filter(Boolean).map(skill => (
                                                                <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    {skill}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {resume.original_cv && <button onClick={() => handleDownload(resume.original_cv)} className="ml-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex-shrink-0">Download CV</button>}
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
