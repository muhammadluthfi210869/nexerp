import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Share2, 
  Calendar, 
  Layers, 
  Plus, 
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { PostItem, PostStatus, SocialPlatform, ContentPillar, ContentType } from '../types';
import { initialPosts } from '../data/mockData';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPost: PostItem) => void;
  initialStatus?: PostStatus;
  initialDate?: string;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&auto=format&fit=crop&q=80',
];

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStatus = 'idea',
  initialDate,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [contentType, setContentType] = useState<ContentType>('reel');
  const [status, setStatus] = useState<PostStatus>(initialStatus);
  const [scheduledDate, setScheduledDate] = useState(
    initialDate || '2026-09-05T18:00'
  );
  const [pillar, setPillar] = useState<ContentPillar>('Educational');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0]);
  const [caption, setCaption] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleAiAutoFill = async () => {
    if (!title.trim()) return;
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_caption',
          topic: title,
          platform,
          pillar,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCaption(data.result.fullCaption || data.result.body || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPost: PostItem = {
      id: `post-${Date.now()}`,
      title: title.trim(),
      platform,
      contentType,
      status,
      scheduledDate,
      pillar,
      coverImage,
      caption: caption || 'Draft konten sedang dalam proses penyusunan.',
      hooks: [`3 Alasan penting kenapa ${title}`],
      cta: 'Komentar di bawah jika postingan ini bermanfaat!',
      hashtags: ['#socialmediaplanner', '#contentmarketing', '#metaads', '#bisnisonline'],
      author: {
        id: 'u-1',
        name: 'Sarah Nabila',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Social Media Lead',
      },
      checklist: [
        { id: 'c-1', text: 'Brainstorming Ide & Hook', done: true },
        { id: 'c-2', text: 'Penyusunan Script & Copy', done: Boolean(caption) },
        { id: 'c-3', text: 'Desain Visual / Recording Reels', done: false },
        { id: 'c-4', text: 'Approval & Final Review', done: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans animate-fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#202020] rounded-2xl shadow-2xl border border-[#e9e8e4] dark:border-[#2f2f2f] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e9e8e4] dark:border-[#2f2f2f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📄</span>
            <h3 className="text-base font-bold text-[#37352f] dark:text-white">
              Tambah Item Perencanaan Konten
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold">
                Judul Konten / Topik Utama *
              </label>
              {title && (
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={isAiGenerating}
                  className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'AI Menulis...' : 'Auto-Generate Caption AI'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Misal: 5 Kesalahan Fatal saat Pasang Iklan Meta..."
              className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white outline-none focus:border-blue-500 text-sm font-medium"
            />
          </div>

          {/* Grid 2 Cols for Platform & Format */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white font-medium"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="threads">Threads</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1">Format Konten</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white font-medium"
              >
                <option value="reel">🎬 Reels / Short Video</option>
                <option value="carousel">📚 Carousel Slider</option>
                <option value="single_post">🖼️ Single Post</option>
                <option value="story">⏱️ Story</option>
                <option value="video">🎥 Long Video</option>
              </select>
            </div>
          </div>

          {/* Grid 2 Cols for Status & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1">Status Awal</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white font-medium"
              >
                <option value="idea">💡 Idea</option>
                <option value="scripting">✍️ Scripting</option>
                <option value="review">👀 In Review</option>
                <option value="scheduled">⏰ Scheduled</option>
                <option value="published">✅ Published</option>
              </select>
            </div>

            <div>
              <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1">Jadwal Tayang</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Pillar Selection */}
          <div>
            <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1">Pilar Konten</label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as ContentPillar)}
              className="w-full p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white font-medium"
            >
              <option value="Educational">Educational (Tutorial & Tips)</option>
              <option value="Promotional">Promotional (Diskon & Penawaran)</option>
              <option value="Behind The Scenes">Behind The Scenes</option>
              <option value="Entertainment">Entertainment (Meme & Relatable)</option>
              <option value="Community">Community & User Generated</option>
              <option value="Product Highlight">Product Highlight</option>
              <option value="Tips & Tricks">Tips & Tricks</option>
            </select>
          </div>

          {/* Preset Visual Covers */}
          <div>
            <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1.5">
              Pilih Gambar Cover / Visual Notion
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COVERS.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setCoverImage(url)}
                  className={`h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition relative ${
                    coverImage === url
                      ? 'border-blue-600 ring-2 ring-blue-400/30'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Cover" className="w-full h-full object-cover" />
                  {coverImage === url && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Caption preview textarea */}
          <div>
            <label className="text-zinc-600 dark:text-zinc-400 font-medium block mb-1">
              Draft Caption (Opsional)
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis draf caption awal..."
              className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-white outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#e9e8e4] dark:border-[#2f2f2f] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition cursor-pointer"
            >
              Simpan Konten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
