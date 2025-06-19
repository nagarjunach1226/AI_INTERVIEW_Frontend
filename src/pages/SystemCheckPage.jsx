import React from 'react';
import CameraCheck from '../components/CameraCheck';
import MicCheck from '../components/MicCheck';
import { useResume } from '../contexts/ResumeContext';
import { useNavigate } from 'react-router-dom'; // <-- Add this

const SystemCheckPage = () => {
  const { resumeFile } = useResume();
  const navigate = useNavigate(); // <-- Add this

  const handleStartInterview = async () => {
    if (!resumeFile) {
      alert('Please upload your resume on the Dashboard first.');
      return;
    }
    const formData = new FormData();
    formData.append('resume', resumeFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/start_interview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) throw new Error(data.detail || 'Failed to upload resume');

      // Navigate to InterviewPage with session info
      navigate('/interview', {
        state: {
          sessionId: data.session_id,
          initialMessage: data.message,
          initialPhase: data.phase,
        },
      });
    } catch (err) {
      alert('Error sending resume: ' + err.message);
    }
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
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                  fill="currentColor"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em]">InterviewAI</h2>
          </div>
          <div className="flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <a className="text-[#0c1c17] text-sm font-medium leading-normal" href="#">Dashboard</a>
              <a className="text-[#0c1c17] text-sm font-medium leading-normal" href="#">Interviews</a>
              <a className="text-[#0c1c17] text-sm font-medium leading-normal" href="#">Settings</a>
            </div>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8DF48_orXWi_BWovkL1yDDpYzLQnqo7bO0GWHhih-a3t3ki5WLJ3MDa1caas67ZevjAivfDhIexNMj0Z3Nu8fyEIk18J4q8eFmgf2SsmfwqMkim3Eg9-i8XyAwwaDw1cFu6HfAPkj11gNkJt53PzCJ7sWAPxNxmeRKhHj2BVVQRrxFJQvduHXP8Ctm5xxTIIq0YvMiWTT4rMslUBxVpof5iasx32ht4MyaZeGZyBCF7bBZKdn3AcphSLcAIdOuZMMkLYFVcX19Qow")',
              }}
            ></div>
          </div>
        </header>
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-[#0c1c17] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Interview Setup
              </p>
            </div>
            <h3 className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              1. Camera Check
            </h3>
            <div className="p-4">
              <CameraCheck />
            </div>
            <p className="text-[#0c1c17] text-base font-normal leading-normal pb-3 pt-1 px-4">
              Ensure your camera is positioned correctly and the lighting is adequate. You should be clearly visible in the frame.
            </p>
            <h3 className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              2. Microphone Check
            </h3>
            <div className="p-4">
              <MicCheck />
            </div>
            <p className="text-[#0c1c17] text-base font-normal leading-normal pb-3 pt-1 px-4">
              Speak clearly and at a normal volume. Adjust your microphone settings if necessary to ensure your voice is easily heard.
            </p>
            <div className="flex px-4 py-3 justify-start">
              <button
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#019863] text-[#f8fcfa] text-base font-bold leading-normal tracking-[0.015em]"
                onClick={handleStartInterview} // Add this
              >
                <span className="truncate">Start Interview</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemCheckPage;