// src/services/sarvamApiService.js
import axios from 'axios';

// --- IMPORTANT: Replace with your actual Sarvam API details ---
const SARVAM_API_KEY = '10b5078d-410e-4e99-989f-48983c87d263'; // Replace!
const SARVAM_STT_ENDPOINT_URL = 'https://api.sarvam.ai/speech-to-text'; // Update to match your prompt
const SARVAM_TTS_ENDPOINT_URL = 'https://api.sarvam.ai/text-to-speech'; // Correct endpoint
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let mediaRecorder;
let audioChunks = [];
let silenceTimer = null;

// Default values for configurable timeouts
const DEFAULT_INITIAL_SPEECH_TIMEOUT = 7000; // 7 seconds
const DEFAULT_USER_TURN_SILENCE_DELAY = 5000; // 5 seconds

export const initializeSarvamApis = async () => {
    if (!SARVAM_API_KEY || SARVAM_API_KEY === 'YOUR_SARVAM_API_KEY') {
        console.error("Sarvam API Key is missing or not replaced!");
        // alert("Sarvam API Key is missing. Please configure it in sarvamApiService.js"); // More visible warning
        return false;
    }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        console.error("Browser does not support audio recording (getUserMedia).");
        return false;
    }
    console.log("Sarvam API services ready.");
    return true;
};

export const sarvamStartListening = ({
    onResult,
    onFinalResult,
    onError,
    onListeningStateChange,
    options = {} // Options object for custom timeouts
}) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError?.({ message: "Audio recording not supported." });
        onListeningStateChange?.(false);
        return;
    }

    // Use provided options or fall back to defaults
    const initialSpeechTimeout = options.initialSpeechTimeout || DEFAULT_INITIAL_SPEECH_TIMEOUT;
    const userTurnSilenceDelay = options.userTurnSilenceDelay || DEFAULT_USER_TURN_SILENCE_DELAY;

    audioChunks = [];
    let hasReceivedDataInTurn = false;

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream); // Consider specifying MIME type if Sarvam is picky

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    hasReceivedDataInTurn = true;
                    // You could provide a very simple "recording in progress" feedback here if needed
                    // onResult?.("..."); // This might be too noisy for the UI unless it's a visual cue
                }

                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                    console.log(`User turn silence (${userTurnSilenceDelay}ms) detected, stopping recording.`);
                    if (mediaRecorder && mediaRecorder.state === "recording") {
                        mediaRecorder.stop();
                    }
                }, userTurnSilenceDelay);
            };

            mediaRecorder.onstop = async () => {
                onListeningStateChange?.(false, "transcribing");
                clearTimeout(silenceTimer); // Ensure no lingering timer
                stream.getTracks().forEach(track => track.stop()); // Release microphone

                if (audioChunks.length === 0) {
                    console.log("No audio chunks recorded.");
                    onFinalResult?.(""); // Send empty string if no audio
                    onListeningStateChange?.(false); // Reset fully
                    return;
                }

                // Use 'audio/wav' as per previous example, ensure Sarvam accepts this.
                // Browsers might default to 'audio/webm;codecs=opus' or similar.
                // If conversion is needed, it's a more complex client-side task.
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = []; // Clear for next recording

                const formData = new FormData();
                formData.append('file', audioBlob, 'user_audio.wav'); // Key 'file' from your Python example
                formData.append('model', 'saarika:v2.5');          // Model from your Python example
                formData.append('language_code', 'en-IN');         // Language from your Python example

                console.log("Sending audio to Sarvam STT...");

                try {
                    const response = await fetch(SARVAM_STT_ENDPOINT_URL, {
                        method: 'POST',
                        headers: {
                            'api-subscription-key': SARVAM_API_KEY // Use the correct header
                        },
                        body: formData,
                    });
                    const data = await response.json();
                    // Use the transcript field from Sarvam's response
                    const transcript = data.transcript || "";
                    onFinalResult?.(transcript);
                } catch (err) {
                    onError?.({ message: `Sarvam STT Error: ${err.message}` });
                } finally {
                    onListeningStateChange?.(false); // Reset to fully stopped
                }
            };

            mediaRecorder.start(); // Start recording
            onListeningStateChange?.(true, "listening");
            hasReceivedDataInTurn = false; // Reset for this new listening session

            // Set the initial timeout for the user to start speaking
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                if (!hasReceivedDataInTurn && mediaRecorder && mediaRecorder.state === "recording") {
                    console.log(`Initial speech timeout (${initialSpeechTimeout}ms), stopping recording.`);
                    mediaRecorder.stop();
                }
            }, initialSpeechTimeout);

        })
        .catch(err => {
            console.error("Error accessing microphone:", err);
            onError?.({ message: `Microphone access error: ${err.message}` });
            onListeningStateChange?.(false);
        });
};

export const sarvamStopListening = () => {
    clearTimeout(silenceTimer); // Important to clear timer on manual stop
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop(); // This will trigger onstop and process the audio
    } else if (mediaRecorder && mediaRecorder.state === "inactive" && audioChunks.length > 0) {
        // This case might happen if stop was called, then stop again before processing finished.
        // Generally, onstop should handle it.
        console.warn("sarvamStopListening called but recorder not active, audio might have been processed or lost.");
    }
    // Note: onListeningStateChange will be called from onstop
};

// --- TTS Related ---
let currentAudioElement = null; // To manage playback

export const sarvamSpeakText = async ({ text, onStart, onEnd, onError }) => {
    if (currentAudioElement) {
        currentAudioElement.pause();
        currentAudioElement.onended = null;
        currentAudioElement.onerror = null;
        if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
            URL.revokeObjectURL(currentAudioElement.src);
        }
        currentAudioElement = null;
    }
    onStart?.();
    console.log("Requesting audio from Sarvam TTS for:", text);

    try {
        const response = await fetch(SARVAM_TTS_ENDPOINT_URL, {
            method: "POST",
            headers: {
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text,
                target_language_code: "en-IN",
                speaker:"vidya"
            }),
        });
        const data = await response.json();
        console.log("Sarvam TTS API Response:", data); // Log the full response for debugging

        if (!response.ok) {
            const serverError = data.detail || data.error || JSON.stringify(data);
            throw new Error(`API returned status ${response.status}: ${serverError}`);
        }

        // Check for the 'audios' key and take the first element
        if (data.audios && data.audios.length > 0) {
            // data.audios[0] is the base64 string
            const base64 = data.audios[0];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const audioBlob = new Blob([byteArray], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);

            currentAudioElement = new Audio(audioUrl);
        } else if (data.audio_url) {
            // fallback for old API
            currentAudioElement = new Audio(data.audio_url);
        } else {
            throw new Error("No audio or audio_url in successful Sarvam TTS response.");
        }

        currentAudioElement.onended = () => {
            onEnd?.();
            if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioElement.src);
            }
            currentAudioElement = null;
        };
        currentAudioElement.onerror = (errEvent) => {
            console.error("Error playing Sarvam TTS audio:", currentAudioElement?.error || errEvent);
            onError?.({ message: `Audio playback error: ${currentAudioElement?.error?.message || 'Unknown'}` });
            if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioElement.src);
            }
            currentAudioElement = null;
            onEnd?.();
        };
        currentAudioElement.play().catch(playError => {
            console.error("Sarvam TTS play() rejected:", playError);
            onError?.({ message: `Audio playback failed: ${playError.message}` });
            if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioElement.src);
            }
            currentAudioElement = null;
            onEnd?.();
        });

    } catch (err) {
        const errorDetail = err.message;
        console.error("Sarvam TTS API Error:", errorDetail);
        // Pass the cleaner error message up to the UI component
        onError?.({ message: errorDetail });
        onEnd?.();
    }
};

export const sarvamCancelSpeech = () => {
    if (currentAudioElement) {
        currentAudioElement.pause();
        // Manually trigger the onended logic if it exists, to ensure cleanup and state update
        if (typeof currentAudioElement.onended === 'function') {
            currentAudioElement.onended(); // This will call the onEnd callback provided to sarvamSpeakText
        } else {
            // Fallback if onended isn't set or already cleared
            if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioElement.src);
            }
        }
        currentAudioElement = null;
        console.log("Sarvam speech cancelled by user.");
    }
};