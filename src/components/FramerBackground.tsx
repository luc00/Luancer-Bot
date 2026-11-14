import React, { useEffect, useRef } from 'react';

interface FramerBackgroundProps {
  src?: string;
}

/**
 * Full-screen interactive Framer background (Soluzione A).
 * - Covers 100vw x 100vh fixed at z-index: -1
 * - Semi-transparent (opacity-40) with subtle sage tint veil for text legibility
 * - Overscans slightly bottom (+84px) and right (+56px) inside overflow-hidden
 *   to cleanly crop cross-origin Framer badge & editor overlay from view
 * - Attempts same-origin DOM cleanup when hosted on matching origin
 */
export const FramerBackground: React.FC<FramerBackgroundProps> = ({
  src = 'https://proud-computer-322757.framer.app',
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const stripBadgeIfSameOrigin = () => {
      try {
        const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!innerDoc) return;
        const badge = innerDoc.getElementById('__framer-badge-container');
        if (badge) badge.remove();
        innerDoc.querySelectorAll('.__framer-badge, [data-framer-badge]').forEach((el) => el.remove());
      } catch {
        // Cross-origin frame: cropping wrapper keeps branding outside viewport without console errors
      }
    };

    iframe.addEventListener('load', stripBadgeIfSameOrigin);
    return () => {
      iframe.removeEventListener('load', stripBadgeIfSameOrigin);
    };
  }, []);

  return (
    <div
      id="framer-bg-wrapper"
      data-testid="framer-bg-wrapper"
      aria-hidden="true"
      className="fixed inset-0 w-screen h-screen -z-10 overflow-hidden bg-[#eef4f0] pointer-events-auto"
    >
      <iframe
        ref={iframeRef}
        id="framer-bg-iframe"
        data-testid="framer-bg-iframe"
        src={src}
        title="Sfondo interattivo Framer 3D"
        loading="eager"
        scrolling="no"
        referrerPolicy="no-referrer-when-downgrade"
        allow="accelerometer; gyroscope"
        className="absolute top-0 left-0 w-[calc(100vw+56px)] h-[calc(100vh+84px)] border-0 opacity-[0.35] block"
      />
      <div className="absolute inset-0 bg-[#eef4f0]/30 pointer-events-none" />
    </div>
  );
};
