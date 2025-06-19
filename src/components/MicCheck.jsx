import React, { useRef, useState } from 'react';

const MicCheck = () => {
  const [level, setLevel] = useState(0);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

  const startMic = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

      setListening(true);
      updateLevel();
    } catch (err) {
      setError('Unable to access microphone. Please check your device permissions.');
    }
  };

  const updateLevel = () => {
    if (!analyserRef.current) return;
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
    // Calculate RMS (root mean square) for volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const val = (dataArrayRef.current[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    setLevel(Math.min(1, rms * 2)); // scale to [0,1]
    rafRef.current = requestAnimationFrame(updateLevel);
  };

  const stopMic = () => {
    setListening(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xl">
      <div className="flex gap-6 justify-between">
        <p className="text-[#0c1c17] text-base font-medium leading-normal">Audio Level</p>
      </div>
      <div className="rounded bg-[#cde9df] h-2 w-full">
        <div
          className="h-2 rounded bg-[#019863] transition-all duration-200"
          style={{ width: `${Math.round(level * 100)}%` }}
        ></div>
      </div>
      <div className="flex py-3">
        {listening ? (
          <button
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e6f4ef] text-[#0c1c17] text-sm font-bold leading-normal tracking-[0.015em]"
            onClick={stopMic}
          >
            Stop Microphone
          </button>
        ) : (
          <button
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#e6f4ef] text-[#0c1c17] text-sm font-bold leading-normal tracking-[0.015em]"
            onClick={startMic}
          >
            Test Microphone
          </button>
        )}
      </div>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default MicCheck;