// This service handles backend API calls for starting and continuing interviews.
// It is modeled after the style of sarvamApiService.js and the usage in InterviewPage.jsx.

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Start a new interview session.
 * @param {File} resumeFile - The user's resume file (PDF, DOCX, etc).
 * @returns {Promise<{ session_id: string, message: string, phase: string }>}
 */
export async function startInterviewAPI(resumeFile) {
  const formData = new FormData();
  formData.append('resume', resumeFile);

  const response = await fetch(`${API_URL}/start_interview`, {
    method: 'POST',
    body: formData,
    // No need to set Content-Type for FormData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to start interview');
  }
  // Expected: { session_id, message, phase }
  return data;
}

/**
 * Continue an interview session by sending user input.
 * @param {string} sessionId - The interview session ID.
 * @param {string} userText - The user's answer or message.
 * @returns {Promise<{ message: string, phase: string, elapsed_time_minutes?: number }>}
 */
export async function continueInterviewAPI(sessionId, userText) {
  const response = await fetch(`${API_URL}/continue_interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      response: userText, // matches backend API
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new Error('Invalid server response');
  }

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to continue interview');
  }
  // Returns: { session_id, message, phase, elapsed_time_minutes }
  return data;
}