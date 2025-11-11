import React from 'react';
import './CentralBranding.css';

export const CentralBranding: React.FC = () => {
  return (
    <div className="central-branding" role="banner">
      <div className="branding-inset">
        {/* SVG Logo */}
        <img 
          src="/logo.svg" 
          alt="MC Museum & Archives" 
          className="branding-logo"
          id="page-title"
        />
        <p className="branding-tagline">
          Explore our history, alumni, and legacy
        </p>
      </div>
    </div>
  );
};
