import React, { useEffect } from 'react';

interface AdBannerProps {
  className?: string;
}

// NOTA: Por favor, substitua com seus próprios IDs de cliente e de slot do AdSense.
const AD_CLIENT = 'ca-pub-0000000000000000'; // Placeholder
const AD_SLOT = '1234567890'; // Placeholder

export const AdBanner: React.FC<AdBannerProps> = ({ className = '' }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`w-full bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center min-h-[96px] overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
        data-ad-test="on" // Isso ativa anúncios de teste. Remova para produção.
      ></ins>
    </div>
  );
};
