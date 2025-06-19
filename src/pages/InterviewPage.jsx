// src/pages/InterviewPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { continueInterviewAPI, startInterviewAPI } from '../services/interviewService'; // Your backend API
import {
    initializeSarvamApis,
    sarvamStartListening,
    sarvamStopListening,
    sarvamSpeakText,
    sarvamCancelSpeech,
} from '../services/sarvamApiService';

// --- UI Icons (same as before) ---
const LogoIcon = () => ( /* ... SVG ... */ <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-4"><path fillRule="evenodd" clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" /><path fillRule="evenodd" clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" /></svg>);
const BellIcon = () => ( /* ... SVG ... */ <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256"><path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z" /></svg>);
const UserAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuB1UV21lqANX2tSTNNuw-SwE2H_Bvt45yRtAj4v4iO1rfuZtAIsoDcIuHnEo5yOCwD99UXH5UzBffi6wj2L1R8-BYlbVcVw4rxjwN14YlzrEVAP8IAQGPGKGwFCox1MWIbSR_ug2phuZJ_xn6nlWZhzQ0ulUbwUtccRFjTjveUvhB90iS08cz3zOLimy60RBYrmzBT5Ag66-kJA3bZOvKr2vzzQZT67suzUwhF5IKe5wVpxKt563YhUjsXFAX93UbsyTHRV5j0RJys";
const AiAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuAaSAcOYhw6l7UW49YH5e6sZXv_jL2evctSmbsQxs6cUbtWOutoxjld0gPIRyYNbQX_AqQuXzOfk3yiRsvhDXxncGs28lI_RgnDa4kKYbPqQ59S9rh_wt-wIm6SGpDJVhuj3uKglMpLQhLFAVWOKIeeXPTaWzU7v1_09kao6YNGcjpNJZyfezBipMaXmdeCPdWTnq-C0ep55Ebq-H6cIQrHjV4IF7demYzenCaHWEaxk2oNWgN9tRKKsQlpkX0Q-JoH4z5lloWI878";
// --- --- --- --- --- --- --- --- ---

// Configuration for STT timeouts
const STT_CONFIG_OPTIONS = {
    initialSpeechTimeout: 7000, // 7 seconds for user to start speaking
    userTurnSilenceDelay: 5000, // 5 seconds of silence during user's turn
};

export default function InterviewPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // Accept resumeFile from navigation state
    const { sessionId: initialSessionId, initialMessage, initialPhase, resumeFile } = location.state || {};

    const [sessionId, setSessionId] = useState(initialSessionId);
    const [messages, setMessages] = useState([]);
    const [currentPhase, setCurrentPhase] = useState(initialPhase || (resumeFile ? "loading" : ""));
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loading, setLoading] = useState(!!resumeFile);
    const [error, setError] = useState('');

    const [isSarvamInitialized, setIsSarvamInitialized] = useState(false);
    const [listeningState, setListeningState] = useState(false); // false, 'listening', 'transcribing'
    const [isSpeakingAi, setIsSpeakingAi] = useState(false);
    const [isBackendLoading, setIsBackendLoading] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState("");

    const messagesEndRef = useRef(null);
    const isSarvamInitializedRef = useRef(false); // Use a ref for immediate access


    useEffect(() => {
        let cancelled = false;
        async function init() {
            setLoading(true);
            setError('');
            const sarvamReady = await initializeSarvamApis();
            isSarvamInitializedRef.current = sarvamReady; // Set the ref value immediately
            setIsSarvamInitialized(sarvamReady);
            if (!sarvamReady) {
                setError("Failed to initialize Sarvam Speech Services. Please try again later.");
                setCurrentPhase("error_init");
                setLoading(false);
                return;
            }

            let session = initialSessionId;
            let message = initialMessage;
            let phase = initialPhase;

            // If no session, but resumeFile is present, call backend
            if (!session && resumeFile) {
                try {
                    const data = await startInterviewAPI(resumeFile);
                    session = data.session_id;
                    message = data.message;
                    phase = data.phase;
                } catch (err) {
                    setError(err.message || 'Failed to start interview');
                    setCurrentPhase("error_init");
                    setLoading(false);
                    return;
                }
            }

            if (!session || !message) {
                setError("No interview session found. Please start a new interview.");
                setCurrentPhase("error_no_session");
                setLoading(false);
                return;
            }

            if (!cancelled) {
                setSessionId(session);
                setMessages([{ sender: 'ai', text: message, avatar: AiAvatar }]);
                setCurrentPhase(phase);
                setLoading(false);
                speakAiResponse(message, () => {
                    if (phase !== 'reporting') {
                        autoStartListening();
                    }
                });
            }
        }
        init();
        return () => { cancelled = true; };
    }, [resumeFile, initialSessionId, initialMessage, initialPhase]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const speakAiResponse = useCallback((textToSpeak, onSpeakingEndCallback) => {
        if (!isSarvamInitializedRef.current) { // Check the ref instead of state
            setError("Sarvam TTS not ready.");
            onSpeakingEndCallback?.();
            return;
        }
        setIsSpeakingAi(true);
        setError('');
        sarvamSpeakText({
            text: textToSpeak,
            onStart: () => console.log("Sarvam TTS started for AI."),
            onEnd: () => {
                setIsSpeakingAi(false);
                onSpeakingEndCallback?.();
            },
            onError: (err) => {
                setError(`Sarvam TTS Error: ${err.message}`);
                setIsSpeakingAi(false);
                onSpeakingEndCallback?.();
            },
        });
    }, []); // No dependency on isSarvamInitialized state needed anymore

    // 1. Define handleSendUserResponse FIRST
    const handleSendUserResponse = useCallback(async (userText) => {
        if (!userText.trim() || !sessionId) {
            setListeningState(false);
            return;
        }
        setMessages(prev => [...prev, { sender: 'user', text: userText, avatar: UserAvatar }]);
        setCurrentTranscript("");
        setIsBackendLoading(true);
        setError('');
        try {
            const data = await continueInterviewAPI(sessionId, userText);
            setMessages(prev => [...prev, { sender: 'ai', text: data.message, avatar: AiAvatar }]);
            setCurrentPhase(data.phase);
            setElapsedTime(data.elapsed_time_minutes);
            setIsBackendLoading(false);
            if (data.phase === 'reporting' || data.phase === 'finished') {
                speakAiResponse(data.message, () => console.log("Interview finished by AI."));
            } else {
                speakAiResponse(data.message, () => autoStartListening());
            }
        } catch (err) {
            const errorMsg = err.detail || err.message || 'Failed to get AI response.';
            setError(errorMsg);
            setIsBackendLoading(false);
            const aiErrorMsg = `Sorry, I encountered an issue: ${errorMsg}. Could you try again?`;
            setMessages(prev => [...prev, { sender: 'ai', text: aiErrorMsg, avatar: AiAvatar }]);
            speakAiResponse(aiErrorMsg, () => autoStartListening());
        }
    }, [sessionId, speakAiResponse, /* autoStartListening will be added later */]);

    // 2. Then define autoStartListening
    const autoStartListening = useCallback(() => {
        if (!isSarvamInitialized || listeningState || isSpeakingAi || isBackendLoading || currentPhase === 'reporting') {
            return;
        }
        setListeningState("listening");
        setCurrentTranscript(""); // Clear any stale transcript
        sarvamStartListening({
            onResult: (interimTranscript) => {
                // If Sarvam provides good live interim results, update currentTranscript here
                // setCurrentTranscript(interimTranscript);
                // For now, MediaRecorder doesn't give clean interim text easily.
            },
            onFinalResult: (finalTranscript) => {
                // setCurrentTranscript(finalTranscript); // Show the final recognized text briefly if desired
                if (finalTranscript.trim()) {
                    handleSendUserResponse(finalTranscript);
                } else {
                    setListeningState(false); // Reset if no speech was captured
                     // Optionally provide feedback like "I didn't catch that."
                    // speakAiResponse("I didn't catch that. Could you please repeat?", autoStartListening);
                }
            },
            onError: (err) => {
                setError(`Sarvam STT Error: ${err.message}`);
                setListeningState(false);
            },
            onListeningStateChange: (isListeningNow, stateDetail) => {
                setListeningState(isListeningNow ? (stateDetail || "listening") : false);
                if (!isListeningNow && listeningState !== "transcribing") { // Clear only if not moving to transcribing
                    setCurrentTranscript("");
                }
            },
            options: STT_CONFIG_OPTIONS
        });
    }, [isSarvamInitialized, listeningState, isSpeakingAi, isBackendLoading, currentPhase, handleSendUserResponse, STT_CONFIG_OPTIONS]);

    const handleToggleListeningManual = () => {
        if (!isSarvamInitialized) {
            setError("Sarvam services not ready.");
            return;
        }
        if (isSpeakingAi) {
            sarvamCancelSpeech();
            // TTS onEnd will trigger autoStartListening if appropriate
            return;
        }
        if (listeningState) {
            sarvamStopListening(); // Will trigger onFinalResult via onstop
        } else {
            autoStartListening();
        }
    };

    const handleLeaveInterview = () => {
        sarvamCancelSpeech();
        if (listeningState) sarvamStopListening();
        navigate('/');
    };

    const getButtonTextAndState = () => {
        if (isSpeakingAi) return { text: "AI Speaking...", disabled: true, showMic: false };
        if (isBackendLoading) return { text: "Processing...", disabled: true, showMic: false };
        if (listeningState === "transcribing") return { text: "Transcribing...", disabled: true, showMic: false };
        if (listeningState === "listening") return { text: "Stop Listening", disabled: false, showMic: true };
        return { text: "Start Listening", disabled: false, showMic: true };
    };
    const { text: listenButtonText, disabled: listenButtonDisabled, showMic } = getButtonTextAndState();

    // Show loading state
    if (loading) {
        return <div className="flex justify-center items-center min-h-screen text-lg">Starting your interview, please wait...</div>;
    }

    if (currentPhase === "loading" && !isSarvamInitialized && !error) {
        return <div className="flex justify-center items-center min-h-screen text-lg">Initializing Services... Please wait.</div>;
    }
    if (currentPhase === "error_init" || currentPhase === "error_no_session") {
         return (
            <div className="flex flex-col justify-center items-center min-h-screen p-10 text-center">
                <p className="text-xl text-red-500 mb-4">{error || "An unknown error occurred."}</p>
                <button
                    onClick={() => navigate('/')}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#019863] text-[#f8fcfa] text-sm font-bold"
                >
                    Go to Start Page
                </button>
            </div>
        );
    }

    return (
        <div
            className="relative flex size-full min-h-screen flex-col bg-[#f8fcfa] group/design-root overflow-x-hidden"
            style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
        >
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e6f4ef] px-4 sm:px-10 py-3">
                <div className="flex items-center gap-2 sm:gap-4 text-[#0c1c17]">
                    <LogoIcon />
                    <h2 className="text-[#0c1c17] text-md sm:text-lg font-bold leading-tight tracking-[-0.015em]">
                        InterviewAI
                    </h2>
                </div>
                <div className="flex flex-1 justify-end gap-2 sm:gap-8 items-center">
                    <p className="text-xs sm:text-sm text-[#46a080] hidden md:block">Session: {sessionId?.substring(0,8) || "N/A"}</p>
                    <button className="p-1 sm:p-2 rounded-lg hover:bg-[#e0f0eb]"> <BellIcon /> </button>
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 sm:size-10" style={{ backgroundImage: `url("${UserAvatar}")` }} ></div>
                </div>
            </header>

            <div className="px-2 sm:px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-3 sm:py-5">
                <div className="layout-content-container flex flex-col max-w-[960px] flex-1 w-full">
                    <div className="flex flex-col sm:flex-row flex-wrap justify-between gap-3 p-2 sm:p-4 items-center">
                        <div className="flex min-w-72 flex-col gap-1 text-center sm:text-left">
                            <p className="text-[#0c1c17] tracking-light text-[24px] sm:text-[28px] md:text-[32px] font-bold leading-tight">
                                Live AI Interview
                            </p>
                            <p className="text-[#46a080] text-xs sm:text-sm font-normal leading-normal">
                                {currentPhase === 'reporting' ? "Interview Concluded" : (listeningState ? "Listening..." : "Interview in progress")}
                                {elapsedTime > 0 && ` (${Math.round(elapsedTime)} mins)`}
                            </p>
                        </div>
                        {currentPhase !== 'reporting' && (
                            <button
                                onClick={handleToggleListeningManual}
                                disabled={listenButtonDisabled || !isSarvamInitialized}
                                className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg h-10 px-3 sm:px-4 text-sm font-bold leading-normal tracking-[0.015em] transition-colors duration-150
                                            ${listenButtonDisabled || !isSarvamInitialized ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#019863] text-[#f8fcfa] cursor-pointer hover:bg-opacity-90'}`}
                            >
                                {showMic && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256" className={`${listeningState === "listening" ? 'animate-pulse' : ''}`}>
                                        <path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0ZM208,128a8,8,0,0,1-8,8,72.08,72.08,0,0,1-72,72,8,8,0,0,1,0-16,56.06,56.06,0,0,0,56-56,8,8,0,0,1,8-8Z"></path>
                                    </svg>
                                )}
                                <span className="truncate">{listenButtonText}</span>
                            </button>
                        )}
                    </div>

                    <h3 className="text-[#0c1c17] text-lg font-bold leading-tight tracking-[-0.015em] px-2 sm:px-4 pb-2 pt-4">
                        Conversation
                    </h3>
                    <div className="flex-grow overflow-y-auto p-2 sm:p-4 space-y-4 min-h-[calc(100vh-350px)] sm:min-h-[300px] max-h-[calc(100vh-250px)] sm:max-h-[60vh] border rounded-lg bg-white shadow-sm">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 sm:gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'ai' && (
                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 sm:w-10 sm:h-10 shrink-0" style={{ backgroundImage: `url("${msg.avatar}")` }}></div>
                                )}
                                <div className={`flex flex-col gap-1 items-${msg.sender === 'user' ? 'end' : 'start'}`}>
                                    <p className="text-[#46a080] text-[11px] sm:text-[13px] font-normal leading-normal max-w-[360px] ${msg.sender === 'user' ? 'text-right' : ''}">
                                        {msg.sender === 'ai' ? 'AI' : 'You'}
                                    </p>
                                    <p className={`text-sm sm:text-base font-normal leading-normal flex max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 sm:px-4 sm:py-3
                                        ${msg.sender === 'user' ? 'bg-[#019863] text-[#f8fcfa]' : 'bg-[#e6f4ef] text-[#0c1c17]'}`}>
                                        {msg.text}
                                    </p>
                                </div>
                                {msg.sender === 'user' && (
                                     <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 sm:w-10 sm:h-10 shrink-0" style={{ backgroundImage: `url("${msg.avatar}")` }}></div>
                                )}
                            </div>
                        ))}
                        {currentTranscript && listeningState === "listening" && (
                             <div className="flex items-end gap-2 sm:gap-3 justify-end">
                                <div className="flex flex-col gap-1 items-end">
                                    <p className="text-[#46a080] text-[11px] sm:text-[13px] font-normal leading-normal max-w-[360px] text-right">You (speaking...)</p>
                                    <p className="text-sm sm:text-base font-normal leading-normal flex max-w-md rounded-lg px-3 py-2 sm:px-4 sm:py-3 bg-[#019863] text-[#f8fcfa] opacity-70">
                                        {currentTranscript || "..."}
                                    </p>
                                </div>
                                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 sm:w-10 sm:h-10 shrink-0" style={{ backgroundImage: `url("${UserAvatar}")` }}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {error && <p className="text-red-500 text-xs sm:text-sm px-2 sm:px-4 pt-2">{error}</p>}

                    <div className="flex px-2 sm:px-4 py-3 mt-2 sm:mt-4 justify-end">
                        <button
                            onClick={handleLeaveInterview}
                            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-3 sm:px-4 bg-[#e6f4ef] text-[#0c1c17] text-sm font-bold leading-normal tracking-[0.015em] hover:bg-opacity-80"
                        >
                            <span className="truncate">Leave Interview</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}