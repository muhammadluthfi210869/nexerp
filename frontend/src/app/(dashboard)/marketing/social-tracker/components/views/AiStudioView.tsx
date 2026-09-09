import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Plus, 
  Wand2, 
  Zap, 
  BookOpen, 
  Flame, 
  Hash, 
  ArrowRight,
  Clock
} from 'lucide-react';
import { SocialPlatform, ContentPillar, PostItem } from '../../types';
import { api } from '@/lib/api';

interface AiStudioViewProps {
  onInsertAsNewPost: (newPost: Partial<PostItem>) => void;
}

export const AiStudioView: React.FC<AiStudioViewProps> = ({ onInsertAsNewPost }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [pillar, setPillar] = useState<ContentPillar>('Educational');
  const [audience, setAudience] = useState('Pebisnis Online & Content Creator Indonesia');
  const [mode, setMode] = useState<'caption' | 'hooks' | 'hashtags'>('caption');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setGeneratedResult(null);

    try {
      let actionType = 'generate_caption';
      if (mode === 'hooks') actionType = 'generate_hooks';

      const res = await api.post('/marketing/social/ai/generate', {
          action: actionType,
          topic,
          platform,
          pillar,
          audience,
      });
      const data = res.data;
      if (data.success) {
        setGeneratedResult(data.result || data.rawText);
      } else {
        setGeneratedResult({ error: data.error || 'Gagal generate AI copy.' });
      }
    } catch (err: any) {
      setGeneratedResult({ error: err.message || 'Network error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreatePostFromAi = () => {
    if (!generatedResult) return;

    if (mode === 'caption' && generatedResult.fullCaption) {
      onInsertAsNewPost({
        title: topic,
        platform: platform,
        pillar: pillar,
        caption: generatedResult.fullCaption || generatedResult.body,
        hooks: generatedResult.hook ? [generatedResult.hook] : [],
        cta: generatedResult.cta || '',
        hashtags: generatedResult.hashtags || [],
        targetAudience: audience,
        status: 'scripting',
        notes: `AI Generated: ${generatedResult.suggestedVisualConcept || ''}`,
      });
    }
  };

  return (
    <div className="w-full max-w-5xl pb-16 pt-2 space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-800 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini 3.7 Flash Engine
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold">Notion AI Social Copywriter & Strategist</h2>
          <p className="text-xs md:text-sm text-purple-200 mt-1 max-w-xl">
            Buat copywriting berkualitas tinggi, 5 variasi viral hook 3-detik, dan rekomendasi hashtag untuk Instagram & Facebook secara instan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Form (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Mode Generator AI:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('caption')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'caption'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Full Caption</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('hooks')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'hooks'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>5 Viral Hooks</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Topik / Judul Konten:
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: 3 Alasan kenapa omset bisnis online mandek dan cara mengatasinya dengan Meta Ads Advantage+..."
              className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Platform:</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                className="w-full text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="threads">Threads</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Pilar Konten:</label>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value as ContentPillar)}
                className="w-full text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white"
              >
                <option value="Educational">Educational</option>
                <option value="Promotional">Promotional</option>
                <option value="Behind The Scenes">Behind The Scenes</option>
                <option value="Product Highlight">Product Highlight</option>
                <option value="Tips & Tricks">Tips & Tricks</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-500 block mb-1">Target Audiens:</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full text-xs p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Sedang Menulis Copywriting...' : 'Generate dengan Gemini AI'}</span>
          </button>
        </div>

        {/* Right Output Area (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#202020] rounded-xl p-5 border border-[#e9e8e4] dark:border-[#2f2f2f] shadow-2xs flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-purple-500" />
                <span>Hasil Output AI</span>
              </span>

              {generatedResult && !generatedResult.error && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(typeof generatedResult === 'string' ? generatedResult : JSON.stringify(generatedResult, null, 2))}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Copy'}</span>
                  </button>

                  {mode === 'caption' && (
                    <button
                      onClick={handleCreatePostFromAi}
                      className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer font-semibold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan ke Notion</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content Display */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Sparkles className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="text-xs">Gemini 3.7 Flash sedang menyusun copywriting bernilai tinggi...</span>
              </div>
            ) : !generatedResult ? (
              <div className="py-20 text-center text-zinc-400 space-y-2">
                <p className="text-xs">Ketik topik konten di sebelah kiri dan klik Generate.</p>
                <p className="text-[11px] text-zinc-500">
                  AI akan menyusun hook viral, struktur body yang rapi, CTA, dan hashtag Meta.
                </p>
              </div>
            ) : generatedResult.error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-xs">
                {generatedResult.error}
              </div>
            ) : mode === 'hooks' && Array.isArray(generatedResult) ? (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  🔥 5 Pilihan Hook 3 Detik Pertama (Pilih yang paling cocok):
                </div>
                {generatedResult.map((hk: string, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => handleCopy(hk)}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200 dark:border-zinc-700/60 hover:border-purple-400 transition cursor-pointer flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex gap-2">
                      <span className="font-bold text-purple-600 font-mono">#{idx + 1}</span>
                      <span className="text-[#37352f] dark:text-zinc-200 font-medium">{hk}</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Full Caption formatted display */}
                {generatedResult.hook && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 block mb-1">
                      🎣 HOOK UTAMA:
                    </span>
                    <p className="font-semibold text-purple-950 dark:text-purple-100">{generatedResult.hook}</p>
                  </div>
                )}

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[#37352f] dark:text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                  {generatedResult.fullCaption || generatedResult.body}
                </div>

                {generatedResult.hashtags && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {generatedResult.hashtags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded text-[11px] font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {generatedResult.bestTimeRecommendation && (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Rekomendasi Waktu Posting: {generatedResult.bestTimeRecommendation}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
