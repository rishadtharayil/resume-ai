import React from 'react';

const Section = ({ title, children, className = '' }) => (
    <div className={`bg-slate-100 p-4 rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">{title}</h3>
        {children}
    </div>
);

const Pill = ({ text, color }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        purple: 'bg-purple-100 text-purple-800',
        slate: 'bg-slate-200 text-slate-800'
    };
    return <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colorClasses[color] || colorClasses.slate}`}>{text}</span>;
};

const FlagList = ({ items, type }) => {
    const isPositive = type === 'positive';
    const icon = isPositive ? '✅' : '❌';
    return (
        <ul className="space-y-2">
            {items && items.map((item, index) => (
                <li key={index} className="flex items-start">
                    <span className="mr-2 pt-1 text-sm">{icon}</span>
                    <span className="text-slate-700">{item}</span>
                </li>
            ))}
        </ul>
    );
};

const ScoreCircle = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    // Ensure score is between 0 and 10 for calculation
    const normalizedScore = Math.max(0, Math.min(10, score || 0));
    const offset = circumference - (normalizedScore / 10) * circumference;

    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
                <circle className="text-slate-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="64" cy="64" />
                <circle
                    className="text-indigo-500"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <span className="absolute text-3xl font-bold text-slate-800">{score ? score.toFixed(1) : 'N/A'}</span>
        </div>
    );
};


const ScorecardModal = ({ resume, onClose }) => {
    if (!resume || !resume.scorecard_data) return null;

    // --- FIX: Changed 'overall_score' to 'match_score' ---
    const {
        match_score,
        summary,
        skill_gap_analysis,
        basic_information,
        experience_analysis,
        skillset_evaluation,
        positive_indicators,
        red_flags,
        cultural_fit_summary,
        personality_signals,
    } = resume.scorecard_data;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-4xl max-h-[90vh] bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">{basic_information?.name || 'Unknown Candidate'}</h2>
                        <p className="text-slate-500">{basic_information?.email} | {basic_information?.phone}</p>
                        {basic_information?.linkedin && <a href={`https://${basic_information.linkedin.replace(/^https?:\/\//,'')}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">LinkedIn Profile</a>}
                    </div>
                    <button onClick={onClose} className="text-3xl text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Section title="Match Score">
                            <div className="flex items-center justify-center pt-2">
                                {/* --- FIX: Pass 'match_score' to the component --- */}
                                <ScoreCircle score={match_score} />
                            </div>
                        </Section>
                        <Section title="✅ Positive Indicators">
                            {positive_indicators?.length > 0 ? <FlagList items={positive_indicators} type="positive" /> : <p className="text-slate-500 text-sm">None identified.</p>}
                        </Section>
                        <Section title="❌ Red Flags">
                            {red_flags?.length > 0 ? <FlagList items={red_flags} type="negative" /> : <p className="text-slate-500 text-sm">None identified.</p>}
                        </Section>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Section title="Experience Analysis">
                            <div className="space-y-3 text-sm text-slate-700">
                                <p><strong>Progression:</strong> {experience_analysis?.seniority_progression?.join(', ') || 'N/A'}</p>
                                <p><strong>Tenure:</strong> {experience_analysis?.tenure_summary || 'N/A'}</p>
                                <p><strong>Domains:</strong> {experience_analysis?.relevant_domains?.join(', ') || 'N/A'}</p>
                            </div>
                        </Section>
                         <Section title="Skillset Evaluation">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-600 mb-2">Hard Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skillset_evaluation?.hard_skills?.length > 0 ? skillset_evaluation.hard_skills.map(skill => <Pill key={skill} text={skill} color="blue" />) : <p className="text-slate-500 text-sm">None listed.</p>}
                                    </div>
                                </div>
                                 <div>
                                    <h4 className="font-semibold text-slate-600 mb-2">Soft Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skillset_evaluation?.soft_skills?.length > 0 ? skillset_evaluation.soft_skills.map(skill => <Pill key={skill} text={skill} color="green" />) : <p className="text-slate-500 text-sm">None listed.</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-600 mb-2">Certifications</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {skillset_evaluation?.certifications?.length > 0 ? skillset_evaluation.certifications.map(cert => <Pill key={cert} text={cert} color="purple" />) : <p className="text-slate-500 text-sm">None listed.</p>}
                                    </div>
                                </div>
                            </div>
                        </Section>
                        <Section title="Personality & Culture Fit">
                             <p className="text-slate-700 italic mb-3">"{summary || 'No summary available.'}"</p>
                             <div className="flex flex-wrap gap-2">
                                {personality_signals?.map(signal => <Pill key={signal} text={signal} />) || ''}
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScorecardModal;
