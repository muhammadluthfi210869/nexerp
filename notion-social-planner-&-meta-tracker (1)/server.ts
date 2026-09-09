import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Meta Business Suite - Check connection & configuration
  app.get('/api/meta/config', (req, res) => {
    const envToken = process.env.META_ACCESS_TOKEN || '';
    const envPageId = process.env.META_PAGE_ID || '';
    const envIgAccountId = process.env.META_IG_ACCOUNT_ID || '';

    res.json({
      hasEnvToken: Boolean(envToken),
      pageId: envPageId,
      igAccountId: envIgAccountId,
      isConfigured: Boolean(envToken && (envPageId || envIgAccountId)),
    });
  });

  // Meta Business Suite - Test token & fetch live connected pages
  app.post('/api/meta/test-connection', async (req, res) => {
    try {
      const token = req.body.accessToken || process.env.META_ACCESS_TOKEN;
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Access Token is required to test Meta Graph API connection.',
        });
      }

      // Call Meta Graph API
      const graphUrl = `https://graph.facebook.com/v19.0/me?fields=id,name,accounts{id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}}&access_token=${encodeURIComponent(token)}`;
      
      const response = await fetch(graphUrl);
      const data = await response.json();

      if (data.error) {
        return res.status(400).json({
          success: false,
          error: data.error.message || 'Meta Graph API returned an error.',
          metaError: data.error,
        });
      }

      return res.json({
        success: true,
        user: {
          id: data.id,
          name: data.name,
        },
        accounts: data.accounts?.data || [],
        raw: data,
      });
    } catch (err: any) {
      console.error('Meta API test error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to connect to Meta Graph API.',
      });
    }
  });

  // Meta Business Suite - Fetch live page / Instagram insights
  app.post('/api/meta/fetch-insights', async (req, res) => {
    try {
      const { accessToken, pageId, igAccountId, period = 'day' } = req.body;
      const token = accessToken || process.env.META_ACCESS_TOKEN;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'No Meta Access Token provided.',
        });
      }

      // If user provided a real IG account ID
      if (igAccountId) {
        const igInsightsUrl = `https://graph.facebook.com/v19.0/${igAccountId}/insights?metric=impressions,reach,profile_views,follower_count&period=${period}&access_token=${encodeURIComponent(token)}`;
        const response = await fetch(igInsightsUrl);
        const data = await response.json();
        return res.json({ success: true, type: 'instagram', data });
      }

      // If user provided a Page ID
      if (pageId) {
        const pageInsightsUrl = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_post_engagements,page_fans&period=${period}&access_token=${encodeURIComponent(token)}`;
        const response = await fetch(pageInsightsUrl);
        const data = await response.json();
        return res.json({ success: true, type: 'facebook_page', data });
      }

      return res.status(400).json({
        success: false,
        error: 'Either Page ID or Instagram Account ID is required.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // AI Assistant - Gemini Copywriter & Strategy Generator
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { action, topic, platform, pillar, audience, existingCaption } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured in environment secrets.',
        });
      }

      const ai = getGeminiClient();
      let prompt = '';

      if (action === 'generate_hooks') {
        prompt = `Bertindaklah sebagai Senior Social Media Strategist & Viral Hook Copywriter spesialis Meta (Instagram & Facebook).
Buatkan 5 variasi Hook (kalimat pembuka 3 detik pertama) yang sangat menarik, click-worthy (bukan clickbait murahan), dan memicu retensi tinggi untuk topik berikut:
Topik Konten: "${topic}"
Platform: ${platform || 'Instagram'}
Pilar Konten: ${pillar || 'Educational'}
Target Audiens: ${audience || 'Gen Z & Millennial Creators / Pebisnis'}

Format output:
Berikan output dalam JSON array murni berisi 5 string hook dalam Bahasa Indonesia yang persuasif, tajam, dan emosional.
Contoh: ["Stop lakukan kesalahan ini...", "Alasan kenapa bisnis kamu...", ...]`;
      } else if (action === 'generate_caption') {
        prompt = `Bertindaklah sebagai Content Copywriting Master untuk Meta Business Suite (Instagram & Facebook).
Buatkan draf postingan lengkap dengan struktur Notion-style untuk:
Judul / Topik: "${topic}"
Platform: ${platform || 'Instagram'}
Pilar Konten: ${pillar || 'Educational'}
Target Audiens: ${audience || 'Creators, Marketers, dan Pebisnis'}

Gunakan formula Copywriting AIDA / PAS yang terbukti menghasilkan Save & Share tinggi di Instagram/Facebook:
1. Hook yang memikat
2. Body konten bernilai tinggi (poin-poin bernomor, formatting rapi, bullet points, emoji yang pas)
3. Call To Action (CTA) yang jelas (misal: ajakan Save, Share, Komentar)
4. Rekomendasi 8-15 Hashtag Relevan (campuran high, medium, dan niche hashtags Indonesia)

Kembalikan jawaban dalam JSON dengan struktur:
{
  "hook": "string",
  "body": "string",
  "cta": "string",
  "hashtags": ["#tag1", "#tag2", ...],
  "fullCaption": "string",
  "bestTimeRecommendation": "string",
  "suggestedVisualConcept": "string"
}`;
      } else if (action === 'improve_caption') {
        prompt = `Bertindaklah sebagai Social Media Copy Editor.
Perbaiki dan optimalkan draf caption berikut agar lebih engaging, enak dibaca di mobile (ada whitespace & bullet points), meningkatkan CTR, dan ramah algoritma Meta:

Caption saat ini:
"""
${existingCaption || topic}
"""

Kembalikan JSON dengan struktur:
{
  "improvedCaption": "string",
  "hooks": ["hook1", "hook2", "hook3"],
  "hashtags": ["#tag1", "#tag2"],
  "improvementsNotes": "string (penjelasan singkat kenapa versi baru lebih powerful)"
}`;
      } else if (action === 'performance_advisor') {
        const { performanceStats } = req.body;
        prompt = `Bertindaklah sebagai Meta Business Suite Data Analyst & Growth Strategist.
Analisis performa postingan/akun berikut dan berikan 3-4 rekomendasi taktis actionable untuk melipatgandakan Reach dan Engagement:
Data Metrik: ${JSON.stringify(performanceStats || {})}

Kembalikan JSON dengan struktur:
{
  "verdict": "string (ringkasan status performa)",
  "viralityScore": 85,
  "keyStrengths": ["string", "string"],
  "areasToImprove": ["string", "string"],
  "actionableTips": ["string", "string", "string"]
}`;
      } else {
        prompt = `Buat ide dan kalender konten social media untuk topik: ${topic}. Format rapi dalam Bahasa Indonesia.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const responseText = response.text || '{}';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({ success: true, result: parsed });
      } catch (parseErr) {
        return res.json({ success: true, rawText: responseText });
      }
    } catch (err: any) {
      console.error('Gemini API error:', err);
      return res.status(500).json({
        error: err.message || 'Failed to generate AI response.',
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
