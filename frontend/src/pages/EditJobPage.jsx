import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor'; // Import the new editor

function EditJobPage({ auth }) {
    const { jobId } = useParams();
    const navigate = useNavigate();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchJobDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/`, {
                    headers: { 'Authorization': `Token ${auth.token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch job details.');
                const data = await response.json();
                setTitle(data.title);
                setDescription(data.description);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        if (auth.token) {
            fetchJobDetails();
        }
    }, [jobId, auth.token]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${auth.token}` },
                body: JSON.stringify({ title, description })
            });
            if (!response.ok) throw new Error('Failed to update job posting.');
            setSuccess('Job posting updated successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    if (isLoading) return <p className="text-center text-slate-500">Loading job details...</p>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <Link to="/dashboard" className="text-sm text-slate-500 hover:text-indigo-600 mb-4 inline-block">&larr; Back to Dashboard</Link>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Job Posting</h2>
                <form onSubmit={handleUpdate} className="space-y-6">
                    {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
                    {success && <p className="text-green-500 text-sm text-center bg-green-100 p-2 rounded-md">{success}</p>}
                    
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                        <input 
                            type="text" id="title" value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                        <RichTextEditor value={description} onChange={setDescription} />
                    </div>
                    <div className="flex justify-end space-x-4 pt-2">
                        <button type="button" onClick={() => navigate('/dashboard')} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditJobPage;
