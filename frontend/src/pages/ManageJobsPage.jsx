import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor'; // Import the new editor

function ManageJobsPage({ auth }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(''); // This will now hold HTML
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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${auth.token}` },
                body: JSON.stringify({ title, description })
            });
            if (!response.ok) throw new Error('Failed to create job posting.');
            setSuccess('Job posting created successfully! Redirecting...');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Create a New Job Posting</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        {/* --- MODIFIED: Use RichTextEditor instead of textarea --- */}
                        <RichTextEditor value={description} onChange={setDescription} />
                    </div>
                    <div className="flex justify-end space-x-4 pt-2">
                        <button type="button" onClick={() => navigate('/dashboard')} className="bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-200">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Create Job</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ManageJobsPage;
