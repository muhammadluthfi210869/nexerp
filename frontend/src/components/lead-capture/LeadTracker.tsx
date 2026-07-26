'use client';

import { useEffect, useRef } from 'react';

/**
 * Invisible Lead Tracker
 * 
 * Dipasang di layout website dreamlab.id.
 * Otomatis melacak:
 * - Page views
 * - Session duration
 * - Scroll depth
 * - CTA clicks (data attribute)
 * - Exit intent
 * 
 * Semua data disimpan di localStorage dan dikirim
 * saat user klik tombol WhatsApp.
 */

interface LeadTrackerConfig {
  /** API endpoint untuk heartbeat (default: /lead-capture/heartbeat) */
  heartbeatUrl?: string;
  /** Interval heartbeat (ms) - default 30000 (30 detik) */
  heartbeatInterval?: number;
  /** Track scroll depth */
  trackScroll?: boolean;
  /** Track exit intent */
  trackExitIntent?: boolean;
}

export default function LeadTracker({
  heartbeatUrl = '/lead-capture/heartbeat',
  heartbeatInterval = 30000,
  trackScroll = true,
  trackExitIntent = true,
}: LeadTrackerConfig) {
  const startTime = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // ── Session ID ──
    let sessionId = localStorage.getItem('dl_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('dl_session_id', sessionId);
    }

    // ── Page view log ──
    const pages = JSON.parse(localStorage.getItem('dl_pages') || '[]');
    pages.push({
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('dl_pages', JSON.stringify(pages.slice(-20))); // keep last 20 pages

    // ── Scroll tracking ──
    if (trackScroll) {
      const handleScroll = () => {
        const scrollPct = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        if (scrollPct > maxScrollRef.current) {
          maxScrollRef.current = scrollPct;
          localStorage.setItem('dl_max_scroll', String(scrollPct));
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }

    // ── Exit intent tracking ──
    if (trackExitIntent) {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          localStorage.setItem('dl_exit_intent', 'true');
          localStorage.setItem('dl_exit_timestamp', new Date().toISOString());
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
  }, [trackScroll, trackExitIntent]);

  // ── Heartbeat (keep session alive) ──
  useEffect(() => {
    if (heartbeatInterval > 0) {
      heartbeatRef.current = setInterval(() => {
        // Silent heartbeat - bisa dikirim ke API jika diperlukan
        const duration = Math.round((Date.now() - startTime.current) / 1000);
        localStorage.setItem('dl_session_duration', String(duration));
      }, heartbeatInterval);

      return () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      };
    }
  }, [heartbeatInterval]);

  // This component renders nothing
  return null;
}
