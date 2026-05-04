import React from 'react';

interface GoSellerLogoProps {
  className?: string;
}

const DEFAULT_LOGO = '/images/Logo (2).png';

const GoSellerLogo: React.FC<GoSellerLogoProps> = ({ className = 'h-9 w-auto object-contain' }) => {
  return <img src={DEFAULT_LOGO} alt="GoSeller" className={className} />;
};

export default GoSellerLogo;
