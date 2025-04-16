"use client"
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const BotpressChatbot = () => {
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAssessmentPage = () => {
    return pathname?.includes('/assessments') || searchParams?.has('skill');
  };

  // Don't render anything at all if it's an assessment page
  if (isAssessmentPage()) return null;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent script reinjection
    if (!window.botpressWebChat && !isScriptsLoaded) {
      const injectScript = document.createElement('script');
      injectScript.src = 'https://cdn.botpress.cloud/webchat/v2.2/inject.js';
      injectScript.async = true;
      injectScript.onload = () => {
        const configScript = document.createElement('script');
        configScript.src = 'https://files.bpcontent.cloud/2025/01/27/19/20250127193107-0FV93D6I.js';
        configScript.async = true;
        configScript.onload = () => setIsScriptsLoaded(true);
        document.body.appendChild(configScript);
      };
      document.body.appendChild(injectScript);
    } else if (window.botpressWebChat) {
      window.botpressWebChat.sendEvent({ type: 'show' });
    }

    return () => {
      if (window.botpressWebChat) {
        window.botpressWebChat.sendEvent({ type: 'hide' });
      }
    };
  }, [pathname, searchParams]);

  return null;
};

export default BotpressChatbot;
