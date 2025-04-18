"use client";

import React from "react";

interface CloudShareProps {
  roomName: string;
  joinCode: string;
  onBack: () => void;
}

export default function CloudShare({
  roomName,
  joinCode,
  onBack,
}: CloudShareProps) {
  // Function to copy join code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinCode);
  };

  // Function to share via system share dialog if supported
  const shareCloud = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Join my cloud: ${roomName}`,
          text: `Join my cloud "${roomName}" with code: ${joinCode}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      copyToClipboard();
      alert("Join code copied to clipboard!");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[#495057] font-serif">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center">
        <button
          onClick={onBack}
          className="text-[#495057] p-2 hover:bg-gray-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-bold text-[#4dd783]">Share Cloud</h1>
      </div>

      <div className="p-6 flex-1">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-block p-4 bg-[#f1f8e9] rounded-full mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-[#4dd783]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#212529] mb-2">
              Share '{roomName}'
            </h2>
            <p className="text-[#6c757d]">Invite friends to join your cloud</p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg bg-white mb-6">
            <div className="text-center mb-2">
              <p className="text-sm text-[#6c757d] mb-1">4-DIGIT CODE</p>
              <p className="text-4xl font-bold tracking-widest text-[#212529]">
                {joinCode}
              </p>
            </div>
            <p className="text-xs text-[#6c757d] text-center">
              Share this code with your friends to let them join your cloud
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={copyToClipboard}
              className="w-full bg-white text-[#495057] py-3 px-4 rounded-lg font-bold border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-[#4dd783]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
              Copy Code
            </button>

            <button
              onClick={shareCloud}
              className="w-full bg-[#4dd783] text-white py-3 px-4 rounded-lg font-bold hover:bg-[#3bb871] transition-colors flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share Cloud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
