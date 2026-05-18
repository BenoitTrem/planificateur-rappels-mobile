import React, { createContext, ReactNode, useContext, useState } from "react";

interface VideoContextType {
  videoUri: string | null;
  setVideoUri: (uri: string | null) => void;
}

interface VideoProviderProps {
  children: ReactNode;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<VideoProviderProps> = ({ children }) => {
  const [videoUri, setVideoUri] = useState<string | null>(null);

  return (
    <VideoContext.Provider value={{ videoUri, setVideoUri }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideoContext must be used within a VideoProvider");
  }
  return context;
};
