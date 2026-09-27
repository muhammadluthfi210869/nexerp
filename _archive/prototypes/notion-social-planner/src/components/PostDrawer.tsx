import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Calendar, 
  Clock, 
  Share2, 
  ExternalLink, 
  Eye, 
  Heart, 
  Bookmark, 
  MessageCircle, 
  Flame, 
  Plus, 
  CheckSquare, 
  Square,
  Smile,
  Send,
  RefreshCw,
  Image as ImageIcon,
  User,
  Sliders,
  Layers,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PostItem, PostStatus, SocialPlatform, ContentPillar, ContentType } from '../types';
import { 
  platformConfig, 
  statusConfig, 
  pillarConfig, 
  contentTypeConfig, 
  formatNumber, 
  formatDateIndonesian 
} from '../utils/notionStyles';

interface PostDrawerProps {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePost: (updated: PostItem) => void;
  onDeletePost: (postId: string) => void;
}

export const PostDrawer: React.FC<PostDrawerProps> = ({
  post,
  isOpen,
  onClose,
  onUpdatePost,
  onDeletePost,
}) => {
  if (!isOpen || !post) return null;

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'ai'>('editor');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');

  const platform = platformConfig[post.platform];
  const status = statusConfig[post.status];
  const pillar = pillarConfig[post.pillar];
  const contentType = contentTypeConfig[post.contentType];

  const handleCopyCaption = () => {
    const fullText = `${post.caption}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleToggleChecklist = (checkId: string) => {
    const updated = post.checklist.map((c) =>
      c.id === checkId ? { ...c, done: !c.done } : c
    );
    onUpdatePost({ ...post, checklist: updated, updatedAt: new Date().toISOString() });
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: `c-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
    };
    onUpdatePost({
      ...post,
      checklist: [...post.checklist, newItem],
      updatedAt: new Date().toISOString(),
    });
    setNewChecklistText('');
  };

  const handlePublishToMeta = () => {
    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const now = new Date().toISOString();
    onUpdatePost({
      ...post,
      status: 'published',
      publishedDate: now,
      metaPostId: `meta_${post.platform}_${Date.now()}`,
      performance: post.performance || {
        reach: Math.floor(Math.random() * 20000) + 5000,
        impressions: Math.floor(Math.random() * 30000) + 8000,
        likes: Math.floor(Math.random() * 1500) + 200,
        comments: Math.floor(Math.random() * 100) + 20,
        shares: Math.floor(Math.random() * 300) + 40,
        saves: Math.floor(Math.random() * 400) + 60,
        engagementRate: Number((Math.random() * 4 + 5).toFixed(1)),
        viralityScore: Math.floor(Math.random() * 20) + 75,
      },
      updatedAt: now,
    });
  };

  const handleAiImprove = async () => {
    setIsAiLoading(true);
    setAiMessage(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'improve_caption',
          existingCaption: post.caption,
          topic: post.title,
          platform: post.platform,
        }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        onUpdatePost({
          ...post,
          caption: data.result.improvedCaption || post.caption,
          hooks: data.result.hooks || post.hooks,
          hashtags: data.result.hashtags || post.hashtags,
          updatedAt: new Date().toISOString(),
        });
        setAiMessage('✨ Caption berhasil dioptimalkan dengan formula viral!');
      }
    } catch (err: any) {
      setAiMessage('Gagal menghubungi Gemini AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs transition-opacity font-sans animate-fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl h-full bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] shadow-2xl flex flex-col overflow-hidden border-l border-[#e9e8e4] dark:border-[#2f2f2f]"
      >
        {/* Drawer Top Navigation Bar */}
        <div className="p-3 border-b border-[#e9e8e4] dark:border-[#2f2f2f] flex items-center justify-between bg-white dark:bg-[#191919] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Notion Page /</span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${platform.bg} ${platform.text}`}>
              {platform.icon} {platform.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Editor vs Live Mockup Preview */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md text-xs">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeTab === 'editor' ? 'bg-white dark:bg-zinc-700 shadow-2xs text-[#37352f] dark:text-white' : 'text-zinc-500'
                }`}
              >
                📝 Dokumen Notion
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeTab === 'preview' ? 'bg-white dark:bg-zinc-700 shadow-2xs text-[#37352f] dark:text-white' : 'text-zinc-500'
                }`}
              >
                📱 Live Meta Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* Notion Page Cover */}
          {post.coverImage ? (
            <div className="h-44 w-full relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-full bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900" />
          )}

          <div className="p-6 md:p-8 space-y-6">
            {/* Title & Emoji Icon */}
            <div>
              <div className="text-3xl mb-2">{platform.icon}</div>
              <input
                type="text"
                value={post.title}
                onChange={(e) => onUpdatePost({ ...post, title: e.target.value, updatedAt: new Date().toISOString() })}
                className="text-2xl font-bold text-[#37352f] dark:text-white bg-transparent border-0 outline-none w-full placeholder-zinc-400"
                placeholder="Judul Konten..."
              />
            </div>

            {/* Notion Database Property Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 p-4 bg-[#fbfbfa] dark:bg-[#202020] rounded-xl border border-[#e9e8e4] dark:border-[#2f2f2f] text-xs">
              {/* Platform */}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> Platform
                </span>
                <select
                  value={post.platform}
                  onChange={(e) => onUpdatePost({ ...post, platform: e.target.value as SocialPlatform, updatedAt: new Date().toISOString() })}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-[#37352f] dark:text-zinc-200 font-medium outline-none"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="threads">Threads</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Status
                </span>
                <select
                  value={post.status}
                  onChange={(e) => onUpdatePost({ ...post, status: e.target.value as PostStatus, updatedAt: new Date().toISOString() })}
                  className={`rounded px-2 py-1 font-semibold outline-none ${status.bg} ${status.text}`}
                >
                  <option value="idea">💡 Idea</option>
                  <option value="scripting">✍️ Scripting</option>
                  <option value="review">👀 Review</option>
                  <option value="scheduled">⏰ Scheduled</option>
                  <option value="published">✅ Published</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>

              {/* Format */}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Format Konten
                </span>
                <select
                  value={post.contentType}
                  onChange={(e) => onUpdatePost({ ...post, contentType: e.target.value as ContentType, updatedAt: new Date().toISOString() })}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-[#37352f] dark:text-zinc-200 font-medium outline-none"
                >
                  <option value="reel">Reels / Video</option>
                  <option value="carousel">Carousel</option>
                  <option value="single_post">Single Post</option>
                  <option value="story">Story</option>
                  <option value="video">Long Video</option>
                </select>
              </div>

              {/* Schedule Date */}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Jadwal Tayang
                </span>
                <input
                  type="datetime-local"
                  value={post.scheduledDate}
                  onChange={(e) => onUpdatePost({ ...post, scheduledDate: e.target.value, updatedAt: new Date().toISOString() })}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-xs font-mono outline-none text-[#37352f] dark:text-zinc-200"
                />
              </div>

              {/* Content Pillar */}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  🏷️ Pilar Konten
                </span>
                <select
                  value={post.pillar}
                  onChange={(e) => onUpdatePost({ ...post, pillar: e.target.value as ContentPillar, updatedAt: new Date().toISOString() })}
                  className="bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1 text-[#37352f] dark:text-zinc-200 font-medium outline-none"
                >
                  <option value="Educational">Educational</option>
                  <option value="Promotional">Promotional</option>
                  <option value="Behind The Scenes">Behind The Scenes</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Community">Community</option>
                  <option value="Product Highlight">Product Highlight</option>
                  <option value="Tips & Tricks">Tips & Tricks</option>
                </select>
              </div>

              {/* Assignee / Author */}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Assignee
                </span>
                <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200">
                  <img src={post.author.avatar} alt="avatar" className="w-4 h-4 rounded-full" />
                  <span>{post.author.name}</span>
                </div>
              </div>
            </div>

            {/* Performance Stats Banner if Published */}
            {post.performance && (
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    <span>Meta Business Suite Live Insights</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    Post ID: {post.metaPostId || 'meta_sync_ok'}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-zinc-400 block">Reach</span>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatNumber(post.performance.reach)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-zinc-400 block">Likes</span>
                    <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-200">
                      {formatNumber(post.performance.likes)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-zinc-400 block">Comments</span>
                    <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-200">
                      {formatNumber(post.performance.comments)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-zinc-400 block">Saves</span>
                    <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-200">
                      {formatNumber(post.performance.saves)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-zinc-400 block">Shares</span>
                    <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-200">
                      {formatNumber(post.performance.shares)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-2xs">
                    <span className="text-[10px] text-zinc-400 block">Eng. Rate</span>
                    <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                      {post.performance.engagementRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: NOTION DOCUMENT EDITOR */}
            {activeTab === 'editor' && (
              <div className="space-y-6">
                {/* Notion Callout Block */}
                {post.calloutText && (
                  <div className="p-3.5 bg-[#fbf5eb] dark:bg-[#2b2720] border-l-4 border-amber-500 rounded-r-lg flex items-start gap-3 text-xs text-[#523d24] dark:text-[#f2d8a7]">
                    <span className="text-lg">{post.calloutEmoji || '💡'}</span>
                    <p className="leading-relaxed font-medium">{post.calloutText}</p>
                  </div>
                )}

                {/* 3-Second Viral Hook Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#37352f] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>🎣 Hook 3 Detik Pertama (Pancingan Perhatian)</span>
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {post.hooks.map((hook, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-xs flex items-center justify-between border border-zinc-200 dark:border-zinc-700/60"
                      >
                        <span className="font-medium text-[#37352f] dark:text-zinc-200">
                          {hook}
                        </span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                          Variasi #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Caption Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-[#37352f] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>📝 Copywriting Caption Lengkap</span>
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiImprove}
                        disabled={isAiLoading}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition font-semibold cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                        <span>{isAiLoading ? 'Memproses...' : 'Optimasi dengan AI'}</span>
                      </button>

                      <button
                        onClick={handleCopyCaption}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition cursor-pointer"
                      >
                        {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCaption ? 'Tersalin' : 'Copy Caption'}</span>
                      </button>
                    </div>
                  </div>

                  {aiMessage && (
                    <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs rounded">
                      {aiMessage}
                    </div>
                  )}

                  <textarea
                    rows={8}
                    value={post.caption}
                    onChange={(e) => onUpdatePost({ ...post, caption: e.target.value, updatedAt: new Date().toISOString() })}
                    className="w-full text-xs p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-[#37352f] dark:text-zinc-200 leading-relaxed outline-none focus:border-blue-500 font-sans"
                    placeholder="Tulis caption postingan di sini..."
                  />
                </div>

                {/* Hashtags */}
                <div>
                  <h4 className="text-xs font-bold text-[#37352f] dark:text-white uppercase tracking-wider mb-2">
                    #️⃣ Hashtags Target Meta Suite
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded text-xs font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Production Checklist */}
                <div>
                  <h4 className="text-xs font-bold text-[#37352f] dark:text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>☑️ Checklist Produksi & Approval</span>
                    <span className="text-[10px] text-zinc-400 font-mono font-normal">
                      {post.checklist.filter((c) => c.done).length} / {post.checklist.length} Selesai
                    </span>
                  </h4>

                  <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
                    {post.checklist.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleToggleChecklist(c.id)}
                        className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white cursor-pointer transition"
                      >
                        {c.done ? (
                          <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        )}
                        <span className={c.done ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}>
                          {c.text}
                        </span>
                      </div>
                    ))}

                    {/* Add checklist input */}
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <input
                        type="text"
                        placeholder="+ Tambah tugas checklist baru..."
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                        className="flex-1 text-xs bg-transparent outline-none text-[#37352f] dark:text-zinc-200 placeholder-zinc-400"
                      />
                      <button
                        onClick={handleAddChecklistItem}
                        className="text-xs text-blue-600 font-semibold px-2 py-0.5 hover:bg-blue-50 rounded"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: LIVE META POST PREVIEW */}
            {activeTab === 'preview' && (
              <div className="py-2 flex flex-col items-center">
                <div className="w-full max-w-sm bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden text-xs">
                  {/* Meta Feed Header */}
                  <div className="p-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-pink-600">
                        <img
                          src={post.author.avatar}
                          alt="avatar"
                          className="w-full h-full rounded-full object-cover border border-white dark:border-black"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-[#262626] dark:text-white block leading-tight">
                          brandstudio.id
                        </span>
                        <span className="text-[10px] text-zinc-400">Sponsored • Meta Suite</span>
                      </div>
                    </div>
                  </div>

                  {/* Media Banner */}
                  <div className="h-80 w-full bg-zinc-100 dark:bg-zinc-900 relative">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt="Post media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Feed Interaction Buttons */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-200">
                      <div className="flex items-center gap-4">
                        <Heart className="w-5 h-5 hover:text-red-500 cursor-pointer" />
                        <MessageCircle className="w-5 h-5 hover:text-blue-500 cursor-pointer" />
                        <Share2 className="w-5 h-5 hover:text-purple-500 cursor-pointer" />
                      </div>
                      <Bookmark className="w-5 h-5 hover:text-amber-500 cursor-pointer" />
                    </div>

                    <div className="font-bold text-xs">
                      {formatNumber(post.performance?.likes || 1420)} likes
                    </div>

                    <p className="text-xs leading-relaxed text-[#262626] dark:text-zinc-200">
                      <span className="font-bold mr-1.5">brandstudio.id</span>
                      {post.caption}
                    </p>

                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                      {post.hashtags.join(' ')}
                    </div>

                    <div className="text-[10px] text-zinc-400 pt-1">
                      Dipublikasikan via Meta Business Suite • {formatDateIndonesian(post.scheduledDate)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Sticky Action Bar */}
        <div className="p-4 border-t border-[#e9e8e4] dark:border-[#2f2f2f] bg-white dark:bg-[#191919] flex items-center justify-between gap-3">
          <button
            onClick={() => onDeletePost(post.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Konten</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
            >
              Tutup
            </button>

            {post.status !== 'published' ? (
              <button
                onClick={handlePublishToMeta}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish ke Meta Suite</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg">
                <Check className="w-4 h-4" />
                <span>Live di Meta</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
