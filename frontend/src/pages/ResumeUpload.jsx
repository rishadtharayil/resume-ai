import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// --- NEW: Import useAuth to check authentication state ---
import { useAuth } from '../hooks/useAuth';

/**
 * The main page for uploading and parsing resumes, with drag-and-drop support.
 */
function ResumeUploadPage() {
    // --- NEW: Get authentication status ---
    const auth = useAuth();

    const [resumeFile, setResumeFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file) => {
        // Validate that it's a PDF
        if (file && file.type === "application/pdf") {
            setResumeFile(file);
            setError('');
            setUploadSuccess(false);
        } else {
            setError('Please upload a valid PDF file.');
            setResumeFile(null);
        }
    };

    const handleFileChange = (event) => {
        handleFile(event.target.files[0]);
    };

    const handleDragOver = (event) => {
        event.preventDefault(); // Prevent default behavior (opening file)
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files[0]);
    };


    const handleUploadAndParse = async () => {
        if (!resumeFile) { setError('Please select a file first.'); return; }
        setIsLoading(true); setError(''); setUploadSuccess(false);
        
        const formData = new FormData();
        formData.append('file', resumeFile);

        try {
            const response = await fetch('http://localhost:8000/api/extract-text/', { method: 'POST', body: formData });
            
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to parse resume.');
                } else {
                    throw new Error(`Server returned a non-JSON error (Status: ${response.status})`);
                }
            }
            
            const data = await response.json();
            setUploadSuccess(true); 

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const startOver = () => { 
        setResumeFile(null); 
        setError(''); 
        setUploadSuccess(false); 
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                {uploadSuccess ? (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4">✅ Analysis Complete!</h2>
                        <p className="text-slate-600 mb-8">The candidate scorecard has been successfully generated and saved.</p>
                        <div className="space-y-4">
                            {/* --- MODIFIED: This button is now conditional --- */}
                            {auth.isAuthenticated && (
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    View Dashboard
                                </button>
                            )}
                            <button 
                                onClick={startOver}
                                className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Upload Another Resume
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Smart Resume Analyzer</h1>
                        <p className="text-slate-600 mb-8">Upload a PDF resume to generate a detailed candidate scorecard.</p>

                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">{error}</div>}
                        
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`w-full h-32 bg-slate-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center mb-6 transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}
                        >
                            <p className="text-slate-500 mb-2">Drag & drop your PDF here, or</p>
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 transition-colors font-semibold">Choose File</span>
                            </label>
                            <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                        </div>
                        {resumeFile && <p className="text-slate-600 mb-6">Selected file: <strong>{resumeFile.name}</strong></p>}

                        <button 
                            onClick={handleUploadAndParse} 
                            disabled={!resumeFile || isLoading} 
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                        </button>
                    </div>
                )}
                
                <footer className="text-center text-slate-400 mt-8 text-sm">Powered by AI & Cloud</footer>
            </div>
        </div>
    );
}

export default ResumeUploadPage;
