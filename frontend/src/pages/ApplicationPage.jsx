import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

/**
 * A dedicated page for an applicant to apply for a specific job.
 */
function ApplicationPage() {
    const { jobId } = useParams(); // Get job ID from the URL
    const navigate = useNavigate();

    const [jobTitle, setJobTitle] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Fetch the job details to display on the page
    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/`);
                if (!response.ok) throw new Error('Could not find the specified job posting.');
                const data = await response.json();
                setJobTitle(data.title);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchJobDetails();
    }, [jobId]);

    const handleFile = (file) => {
        if (file && file.type === "application/pdf") {
            setResumeFile(file);
            setError('');
        } else {
            setError('Please upload a valid PDF file.');
        }
    };

    const handleFileChange = (e) => handleFile(e.target.files[0]);
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const handleApply = async () => {
        if (!resumeFile) {
            setError('Please upload your resume before applying.');
            return;
        }
        setIsLoading(true);
        setError('');
        setUploadSuccess(false);

        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('job_description_id', jobId);

        try {
            const response = await fetch('http://localhost:8000/api/analyze-resume/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Application failed.');
            }
            
            setUploadSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (uploadSuccess) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">✅ Application Sent!</h2>
                <p className="text-slate-600 mb-8">Thank you for applying for the {jobTitle} position. We have received your resume and will be in touch if there's a good fit.</p>
                <button onClick={() => navigate('/')} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700">
                    Back to Job Board
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                {jobTitle ? (
                    <div>
                        <Link to="/" className="text-sm text-slate-500 hover:text-indigo-600 mb-4 inline-block">&larr; Back to all jobs</Link>
                        <h1 className="text-xl text-slate-600">You are applying for:</h1>
                        <h2 className="text-3xl font-bold text-slate-800">{jobTitle}</h2>
                        
                        <div className="my-8 border-t border-slate-200"></div>

                        <h3 className="text-xl font-semibold text-slate-700 mb-4">Upload Your Resume to Apply</h3>

                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert">{error}</div>}
                        
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`w-full h-32 bg-slate-50 border-2 border-dashed rounded-lg flex flex-col items-center justify-center mb-6 transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}
                        >
                            <p className="text-slate-500 mb-2">Drag & drop resume PDF here, or</p>
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-50 font-semibold">Choose File</span>
                            </label>
                            <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                        </div>
                        {resumeFile && <p className="text-slate-600 mb-6 text-center">Selected file: <strong>{resumeFile.name}</strong></p>}

                        <button 
                            onClick={handleApply} 
                            disabled={!resumeFile || isLoading} 
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300"
                        >
                            {isLoading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-slate-500">{error || 'Loading job details...'}</p>
                )}
            </div>
        </div>
    );
}

export default ApplicationPage;
