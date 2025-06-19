import React from 'react';
import ResumeUploader from '../components/ResumeUploader';
import { useResume } from '../contexts/ResumeContext';
import { useNavigate } from 'react-router-dom'; // Add this

const DashboardPage = () => {
  const { setResumeFile } = useResume();
  const navigate = useNavigate(); // Add this

  const handleFileUpload = (file) => {
    setResumeFile(file);
    console.log('Uploaded file:', file);
  };

  const handleStartInterview = () => {
    navigate('/system-check'); // Navigate to systemcheck
  };

  return (
    <div
      className="relative flex size-full min-h-screen flex-col bg-[#f8fcfa] group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e6f4ef] px-10 py-3">
          <div className="flex items-center gap-4 text-[#0c1c17]">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_319)">
                  <path
                    d="M8.57829 8.57829C5.52816 11.6284 3.451 15.5145 2.60947 19.7452C1.76794 23.9758 2.19984 28.361 3.85056 32.3462C5.50128 36.3314 8.29667 39.7376 11.8832 42.134C15.4698 44.5305 19.6865 45.8096 24 45.8096C28.3135 45.8096 32.5302 44.5305 36.1168 42.134C39.7033 39.7375 42.4987 36.3314 44.1494 32.3462C45.8002 28.361 46.2321 23.9758 45.3905 19.7452C44.549 15.5145 42.4718 11.6284 39.4217 8.57829L24 24L8.57829 8.57829Z"
                    fill="currentColor"
                  ></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_319"><rect width="48" height="48" fill="white"></rect></clipPath>
                </defs>
              </svg>
            </div>
            <h2 className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em]">
              Interview AI
            </h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAHyQg8IrN1MzVhTORZUPGkVEvZ2CC1ZvDHnGA0-csXy9DuzPa8Yp4M_fpWUCV-qo3F2nNFOkLfTzk1qdamdn6QmRDDWMEQIV36D7hMsb8qaA_kekimggr0oVcjbeCwaN5nT7aMLlIFKm4yXa11TRNhol937Z605A74G3vjL0xiWjWCHRJx9uUFkHjg5Ke72BgswVW18tNq_k-RD1xH_7mizmohIye-qdbXhUaJ2Y_7s0mI97yCLPFa3_wBI4uOdK3BpbCqd-EtKwA")',
              }}
            ></div>
          </div>
        </header>
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <h1 className="text-[#0c1c17] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-center pb-3 pt-5">
              Upload Your Resume
            </h1>
            <ResumeUploader onFileUpload={handleFileUpload} />
            <div className="flex justify-end overflow-hidden px-5 pb-5">
              <button
                className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 bg-[#019863] text-[#f8fcfa] text-base font-bold leading-normal tracking-[0.015em] min-w-0 gap-4 pl-4 pr-6"
                onClick={handleStartInterview} // Add this
              >
                <div className="text-[#f8fcfa]" data-icon="Plus" data-size="24px" data-weight="regular">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
                  </svg>
                </div>
                <span className="truncate">Start New Practice Interview</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;