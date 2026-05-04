'use client';

import React from 'react';

type AuthSignInBannerProps = {
  src: string;
  /** Short description for accessibility */
  alt: string;
};

/** Fills the entire right half of the sign-in split (md+); edge-to-edge, not a centered card. */
export function AuthSignInBanner({ src, alt }: AuthSignInBannerProps) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-wm-bar to-wm-page">
      <img src={src} alt={alt} className="h-full w-full object-cover object-center" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-24 max-w-[18%] bg-gradient-to-r from-black/[0.08] to-transparent"
        aria-hidden
      />
    </div>
  );
}
