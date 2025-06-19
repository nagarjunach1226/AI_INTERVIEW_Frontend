import React, { useRef, useState } from 'react';

const ResumeUploader = ({ onFileUpload }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    setFileName(file.name);
    if (onFileUpload) onFileUpload(file);
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="flex flex-col p-4">
      <div
        className={`flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-[#cde9df] px-6 py-14 cursor-pointer transition-colors ${
          dragActive ? 'bg-[#e6f4ef]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleChange}
        />
        <p className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
          Drag &amp; Drop or Click to Upload
        </p>
        {fileName && (
          <span className="text-[#46a080] text-sm font-medium">{fileName}</span>
        )}
      </div>
      <div className="flex px-4 py-3 justify-center">
        <button
          type="button"
          onClick={handleClick}
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e6f4ef] text-[#0c1c17] text-sm font-bold leading-normal tracking-[0.015em]"
        >
          <span className="truncate">Browse Files</span>
        </button>
      </div>
    </div>
  );
};

export default ResumeUploader;