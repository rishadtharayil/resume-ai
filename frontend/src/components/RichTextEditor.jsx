import React from 'react';

/**
 * A simple, lightweight Rich Text Editor component.
 */
const RichTextEditor = ({ value, onChange }) => {
    
    const handleCommand = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    const handleInput = (e) => {
        onChange(e.target.innerHTML);
    };

    return (
        <div className="border border-slate-300 rounded-lg shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center p-2 border-b border-slate-200 bg-slate-50 rounded-t-lg space-x-2">
                <button type="button" onClick={() => handleCommand('bold')} className="px-3 py-1 text-sm font-bold rounded hover:bg-slate-200">B</button>
                <button type="button" onClick={() => handleCommand('formatBlock', 'h2')} className="px-3 py-1 text-sm font-semibold rounded hover:bg-slate-200">H2</button>
                <button type="button" onClick={() => handleCommand('formatBlock', 'h3')} className="px-3 py-1 text-sm font-semibold rounded hover:bg-slate-200">H3</button>
                <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="px-3 py-1 text-sm rounded hover:bg-slate-200">● List</button>
            </div>
            
            {/* Editable Content Area */}
            <div
                contentEditable={true}
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: value }}
                className="w-full min-h-[250px] p-3 text-sm focus:outline-none"
                placeholder="Enter job description..."
            />
        </div>
    );
};

export default RichTextEditor;
