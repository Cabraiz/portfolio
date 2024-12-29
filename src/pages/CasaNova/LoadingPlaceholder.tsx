import React from 'react';

const LoadingPlaceholder: React.FC = () => {
  return (
    <div className="loading-placeholder">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="loading-card">
          <div className="loading-image shimmer"></div>
          <div className="loading-title shimmer"></div>
          <div className="loading-button shimmer"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingPlaceholder;
