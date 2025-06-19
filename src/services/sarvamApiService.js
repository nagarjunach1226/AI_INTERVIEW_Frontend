import axios from 'axios';

// --- IMPORTANT: Replace with your actual Sarvam API details ---
const SARVAM_API_KEY = '10b5078d-410e-4e99-989f-48983c87d263'; // Replace!
const SARVAM_STT_ENDPOINT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_TTS_ENDPOINT_URL = 'https://api.sarvam.ai/text-to-speech';
// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

let mediaRecorder;
let audioChunks = [];
let silenceTimer = null;
let currentAudioElement = null; // To manage playback

// Default values for configurable timeouts
const DEFAULT_INITIAL_SPEECH_TIMEOUT = 7000; // 7 seconds
const DEFAULT_USER_TURN_SILENCE_DELAY = 5000; // 5 seconds

// Function to split text into chunks based on max characters
function splitText(text, maxChars = 150) {
    const sentences = text.split(/(?<=[.?!])\s+/);
    const chunks = [];
    let currentChunk = '';
    let charCount = 0;

    sentences.forEach((sentence, index) => {
        const charsInSentence = sentence.length;

        // Handle rare case of single sentence exceeding maxChars
        if (charsInSentence > maxChars) {
            console.warn(`Sentence ${index} exceeds ${maxChars} characters; splitting further.`);
            const subChunks = splitLongSentence(sentence, maxChars);
            subChunks.forEach(subChunk => {
                if (charCount + subChunk.length > maxChars) {
                    if (currentChunk !== '') {
                        chunks.push(currentChunk.trim());
                        currentChunk = subChunk;
                        charCount = subChunk.length;
                    }
                } else {
                    currentChunk += ' ' + subChunk;
                    charCount += subChunk.length;
                }
            });
        } else if (charCount + charsInSentence > maxChars) {
            if (currentChunk !== '') {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                charCount = charsInSentence;
            }
        } else {
            currentChunk += ' ' + sentence;
            charCount += charsInSentence;
        }
    });
    if (currentChunk !== '') {
        chunks.push(currentChunk.trim());
    }
    console.debug(`Split text into ${chunks.length} chunks:`, chunks);
    return chunks;
}

// Helper function to split long sentences
function splitLongSentence(sentence, maxChars) {
    const subChunks = [];
    let currentSubChunk = '';
    const words = sentence.split(/\s+/);
    words.forEach(word => {
        if ((currentSubChunk + ' ' + word).length > maxChars) {
            subChunks.push(currentSubChunk.trim());
            currentSubChunk = word;
        } else {
            currentSubChunk += ' ' + word;
        }
    });
    if (currentSubChunk !== '') {
        subChunks.push(currentSubChunk.trim());
    }
    return subChunks;
}

export const initializeSarvamApis = async () => {
    if (!SARVAM_API_KEY || SARVAM_API_KEY === 'YOUR_SARVAM_API_KEY') {
        console.error("Sarvam API Key is missing or not replaced!");
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
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                    hasReceivedDataInTurn = true;
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
                clearTimeout(silenceTimer);
                stream.getTracks().forEach(track => track.stop());

                if (audioChunks.length === 0) {
                    console.log("No audio chunks recorded.");
                    onFinalResult?.("");
                    onListeningStateChange?.(false);
                    return;
                }

                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioChunks = [];

                const formData = new FormData();
                formData.append('file', audioBlob, 'user_audio.wav');
                formData.append('model', 'saarika:v2.5');
                formData.append('language_code', 'en-IN');

                console.log("Sending audio to Sarvam STT...");

                try {
                    const response = await fetch(SARVAM_STT_ENDPOINT_URL, {
                        method: 'POST',
                        headers: {
                            'api-subscription-key': SARVAM_API_KEY
                        },
                        body: formData,
                    });
                    const data = await response.json();
                    const transcript = data.transcript || "";
                    onFinalResult?.(transcript);
                } catch (err) {
                    onError?.({ message: `Sarvam STT Error: ${err.message}` });
                } finally {
                    onListeningStateChange?.(false);
                }
            };

            mediaRecorder.start(250); // 250ms timeslice for more frequent ondataavailable
            onListeningStateChange?.(true, "listening");
            hasReceivedDataInTurn = false;

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
    clearTimeout(silenceTimer);
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
    } else if (mediaRecorder && mediaRecorder.state === "inactive" && audioChunks.length > 0) {
        console.warn("sarvamStopListening called but recorder not active, audio might have been processed or lost.");
    }
};

export const sarvamSpeakText = async ({ text, onStart, onEnd, onError }) => {
    // Clean up any existing audio playback
    if (currentAudioElement) {
        if (currentAudioElement instanceof AudioBufferSourceNode) {
            currentAudioElement.stop();
            currentAudioElement = null;
        } else if (currentAudioElement instanceof HTMLAudioElement) {
            currentAudioElement.pause();
            if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(currentAudioElement.src);
            }
            currentAudioElement = null;
        }
    }
    onStart?.();
    console.log("Requesting audio from Sarvam TTS for text:", text);

    try {
        // Split the text into chunks
        const chunks = splitText(text);
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffers = [];

        // Process each chunk and get audio buffers
        for (const [index, chunk] of chunks.entries()) {
            try {
                const response = await fetch(SARVAM_TTS_ENDPOINT_URL, {
                    method: "POST",
                    headers: {
                        "api-subscription-key": SARVAM_API_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        text: chunk,
                        target_language_code: "en-IN",
                        speaker: "vidya"
                    }),
                });
                const data = await response.json();
                console.debug(`API response for chunk ${index}:`, data);

                if (!response.ok) {
                    console.warn(`API error for chunk ${index}: ${data.detail || data.error || 'Unknown'}`);
                    continue; // Skip this chunk
                }
                if (!data.audios || data.audios.length === 0) {
                    console.warn(`No audio in response for chunk ${index}.`);
                    continue; // Skip this chunk
                }

                // Decode base64 audio to binary
                const base64 = data.audios[0];
                const byteCharacters = atob(base64);
                const byteNumbers = new Uint8Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const audioData = byteNumbers.buffer;

                // Decode audio data to AudioBuffer
                const buffer = await audioContext.decodeAudioData(audioData);
                console.debug(`Audio buffer for chunk ${index}: channels=${buffer.numberOfChannels}, sampleRate=${buffer.sampleRate}, length=${buffer.length}`);
                audioBuffers.push(buffer);
            } catch (err) {
                console.warn(`Error processing chunk ${index}: ${err.message}`);
                continue; // Skip this chunk
            }
        }

        // Combine audio buffers into one
        if (audioBuffers.length > 0) {
            const numberOfChannels = audioBuffers[0].numberOfChannels;
            const sampleRate = audioBuffers[0].sampleRate;

            // Verify all buffers have the same properties
            const allConsistent = audioBuffers.every(buffer => 
                buffer.numberOfChannels === numberOfChannels && buffer.sampleRate === sampleRate
            );
            if (!allConsistent) {
                throw new Error("Audio buffers have inconsistent channels or sample rates.");
            }

            let totalLength = 0;
            audioBuffers.forEach(buffer => totalLength += buffer.length);

            const combinedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);
            let offset = 0;
            audioBuffers.forEach(buffer => {
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const channelData = combinedBuffer.getChannelData(channel);
                    channelData.set(buffer.getChannelData(channel), offset);
                }
                offset += buffer.length;
            });

            // Play the combined audio
            const source = audioContext.createBufferSource();
            source.buffer = combinedBuffer;
            source.connect(audioContext.destination);
            source.onended = () => {
                console.debug("Audio playback completed.");
                onEnd?.();
                currentAudioElement = null;
            };
            source.start();
            currentAudioElement = source;
        } else {
            throw new Error("No valid audio buffers received.");
        }
    } catch (err) {
        console.error("Sarvam TTS Error:", err);
        onError?.({ message: err.message });
        onEnd?.();
    }
};

export const sarvamCancelSpeech = () => {
    if (currentAudioElement) {
        if (currentAudioElement instanceof AudioBufferSourceNode) {
            currentAudioElement.stop();
            if (typeof currentAudioElement.onended === 'function') {
                currentAudioElement.onended();
            }
            currentAudioElement = null;
        } else if (currentAudioElement instanceof HTMLAudioElement) {
            currentAudioElement.pause();
            if (typeof currentAudioElement.onended === 'function') {
                currentAudioElement.onended();
            } else {
                if (currentAudioElement.src && currentAudioElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(currentAudioElement.src);
                }
            }
            currentAudioElement = null;
        }
        console.log("Sarvam speech cancelled by user.");
    }
};