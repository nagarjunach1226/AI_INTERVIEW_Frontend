import React, { useRef, useState, useEffect } from 'react';

const CameraCheck = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [stream, setStream] = useState(null);

  const handleStartCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check your device permissions and make sure you are using HTTPS or localhost.');
    }
  };

  // Attach stream to video when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Cleanup: stop camera when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center bg-[#019863] aspect-video rounded-lg p-4 w-full max-w-xl">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded-lg w-full h-full object-cover"
            style={{ background: '#000' }}
          />
        ) : (
          <button
            className="flex shrink-0 items-center justify-center rounded-full size-16 bg-black/40 text-white"
            onClick={handleStartCamera}
            aria-label="Start Camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
              <path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"></path>
            </svg>
          </button>
        )}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default CameraCheck;