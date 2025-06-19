import React, { createContext, useContext, useState } from 'react';

const ResumeContext = createContext();

export const useResume = () => useContext(ResumeContext);

export const ResumeProvider = ({ children }) => {
  const [resumeFile, setResumeFile] = useState(null);

  return (
    <ResumeContext.Provider value={{ resumeFile, setResumeFile }}>
      {children}
    </ResumeContext.Provider>
  );
};