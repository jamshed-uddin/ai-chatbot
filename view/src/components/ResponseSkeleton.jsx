import React from "react";

const ResponseSkeleton = () => {
  return (
    <div className="space-y-3 p-3 max-w-[80%]">
      <div className="h-4 bg-gray-300 rounded-lg animate-pulse w-full" />
      <div className="h-4 bg-gray-300 rounded-lg animate-pulse w-[60%]" />
      <div className="h-4 bg-gray-300 rounded-lg animate-pulse w-[90%]" />
    </div>
  );
};

export default ResponseSkeleton;
