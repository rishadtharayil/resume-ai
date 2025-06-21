import React, { useState } from 'react';
import DetailInput from '../components/DetailInput.jsx';

// --- Resume Upload Page Component (Corrected Version) ---
function ResumeUploadPage() {
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeData, setResumeData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleFileChange = (event) => {
        setResumeFile(event.target.files[0]);
        setError('');
        setSuccessMessage('');
    };

    const handleDataChange = (event) => {
        const { name, value } = event.target;
        setSuccessMessage(''); // Clear success message on edit
        setResumeData(prevData => {
            const isArrayField = ['skills', 'education', 'experience'].includes(name);
            return { ...prevData, [name]: isArrayField ? value.split(/,|\n/).map(s => s.trim()) : value };
        });
    };

    const handleUploadAndParse = async () => {
        if (!resumeFile) { setError('Please select a file first.'); return; }
        setIsLoading(true); setError(''); setSuccessMessage(''); setResumeData(null);
        const formData = new FormData();
        formData.append('file', resumeFile);
        try {
            const response = await fetch('http://localhost:8000/api/extract-text/', { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to parse resume.');
            setResumeData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToDatabase = async () => {
        if (!resumeData || !resumeData.id) { setError('No data to save.'); return; }
        setIsLoading(true); setError(''); setSuccessMessage('');
        try {
            const response = await fetch(`http://localhost:8000/api/resume/${resumeData.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resumeData),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save details.');
            setSuccessMessage(data.message || 'Details saved successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startOver = () => { setResumeFile(null); setResumeData(null); setError(''); setSuccessMessage(''); };

    // This component now returns ONLY the content, not the full page layout
    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 space-y-6">
            <header>
                <h1 className="text-4xl font-bold text-center text-slate-800 mb-2">AI Resume Parser</h1>
                <p className="text-center text-slate-500">Upload a PDF to extract, verify, and save details to the database.</p>
            </header>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center" role="alert"><strong className="font-bold">Error: </strong>{error}</div>}
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md text-center" role="alert"><strong className="font-bold">Success! </strong>{successMessage}</div>}
            {isLoading && <div className="text-center py-8"><p className="text-lg text-blue-600 animate-pulse">Processing...</p></div>}

            {!resumeData && !isLoading && (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center space-y-4">
                    <p className="text-slate-600">Upload your resume in PDF format.</p>
                    <input type="file" accept=".pdf" onChange={handleFileChange} className="block w-full max-w-xs mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    <button onClick={handleUploadAndParse} disabled={!resumeFile} className="w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors">Parse Resume</button>
                </div>
            )}
            
            {resumeData && !isLoading && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold text-slate-700 border-b pb-2">Verify & Edit Extracted Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailInput label="Full Name" name="name" value={resumeData.name} onChange={handleDataChange} />
                        <DetailInput label="Email Address" name="email" value={resumeData.email} onChange={handleDataChange} type="email" />
                        <DetailInput label="Phone Number" name="phone" value={resumeData.phone} onChange={handleDataChange} />
                    </div>
                    <DetailInput label="Skills (comma or newline separated)" name="skills" value={resumeData.skills} onChange={handleDataChange} type="textarea" />
                    <DetailInput label="Education" name="education" value={resumeData.education} onChange={handleDataChange} type="textarea" />
                    <DetailInput label="Experience" name="experience" value={resumeData.experience} onChange={handleDataChange} type="textarea" />
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                        <button onClick={startOver} className="w-full bg-slate-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-600 focus:outline-none transition-colors">Start Over</button>
                        <button onClick={handleSaveToDatabase} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none transition-colors">Verify & Save to Database</button>
                    </div>
                </div>
            )}
             <footer className="text-center text-slate-500 mt-6 text-sm">
                Powered by React & Django & Gemini
            </footer>
        </div>
    );
}

export default ResumeUploadPage;