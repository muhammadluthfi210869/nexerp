'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

export interface SmartWAProps {
  phoneNumber?: string;
  message?: string;
  intent?: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: 'whatsapp' | 'chat' | 'default';
  onTracked?: (data: { trackingCode: string; waUrl: string }) => void;
  onError?: (error: Error) => void;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('dl_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('dl_session_id', sid);
  }
  return sid;
}

function getDeviceInfo() {
  if (typeof window === 'undefined') return { deviceType: 'unknown', browser: 'unknown' };
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  let deviceType = 'desktop';
  if (isMobile) deviceType = 'mobile';
  if (isTablet) deviceType = 'tablet';
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'chrome';
  else if (ua.includes('Firefox')) browser = 'firefox';
  else if (ua.includes('Safari')) browser = 'safari';
  else if (ua.includes('Edge')) browser = 'edge';
  return { deviceType, browser };
}

function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmContent: params.get('utm_content') || undefined,
    utmTerm: params.get('utm_term') || undefined,
  };
}

export default function SmartWhatsAppButton({
  phoneNumber,
  message,
  intent,
  label = 'Hubungi via WhatsApp',
  variant = 'primary',
  size = 'md',
  className = '',
  icon = 'whatsapp',
  onTracked,
  onError,
}: SmartWAProps) {
  const [tracking, setTracking] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white',
    ghost: 'text-[#25D366] hover:bg-[#25D366]/10',
  };

  const icons = {
    whatsapp: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    chat: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
      </svg>
    ),
    default: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M19 14v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2zm-8-9c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 10c4.42 0 8 1.79 8 4v2H3v-2c0-2.21 3.58-4 8-4z"/>
      </svg>
    ),
  };

  const handleClick = useCallback(async () => {
    if (tracking) return;
    setTracking(true);

    const deviceInfo = getDeviceInfo();
    const utmParams = getUtmParams();

    const payload = {
      intent: intent || document.title,
      pageUrl: window.location.href,
      pageTitle: document.title,
      referrer: document.referrer || undefined,
      sessionId,
      ...deviceInfo,
      ...utmParams,
    };

    try {
      const resp = await api.post('/lead-capture/track', payload);
      const { trackingCode, waUrl } = resp.data;
      onTracked?.(resp.data);

      const phone = phoneNumber || process.env.NEXT_PUBLIC_WA_PHONE || '6281234567890';
      let waMessage = message || `Halo%20DreamLab!`;
      if (intent) {
        waMessage += `%0ASaya%20tertarik%20dengan%3A%20${encodeURIComponent(intent)}`;
      }
      waMessage += `%0A%0A[Kode%3A%20${trackingCode}]`;

      window.open(`https://wa.me/${phone}?text=${waMessage}`, '_blank');
    } catch (err) {
      console.error('[SmartWA] Tracking failed, fallback to direct WA:', err);
      onError?.(err instanceof Error ? err : new Error('Tracking failed'));

      const phone = phoneNumber || process.env.NEXT_PUBLIC_WA_PHONE || '6281234567890';
      let fallbackMsg = message || `Halo%20DreamLab!`;
      if (intent) {
        fallbackMsg += `%0ASaya%20tertarik%20dengan%3A%20${encodeURIComponent(intent)}`;
      }
      window.open(`https://wa.me/${phone}?text=${fallbackMsg}`, '_blank');
    } finally {
      setTracking(false);
    }
  }, [intent, message, phoneNumber, sessionId, tracking, onTracked, onError]);

  return (
    <button
      onClick={handleClick}
      disabled={tracking}
      className={`
        inline-flex items-center justify-center font-semibold rounded-xl
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {tracking ? (
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        icons[icon]
      )}
      {tracking ? 'Memproses...' : label}
    </button>
  );
}
