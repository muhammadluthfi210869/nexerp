import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import { num, pct, str } from './utils/sheet-parser';
import {
  SummaryData,
  StoriesKpiRow,
  TrackerRow,
  StoriesKpi,
} from './interfaces/summary.interface';
import { WeeklyData, WeeklyRow } from './interfaces/weekly.interface';
import { PaidAdsData, PaidAdsRow } from './interfaces/paid-ads.interface';
import { ContentData, ContentRow } from './interfaces/content.interface';

@Injectable()
export class DigimarService implements OnModuleInit {
  private readonly logger = new Logger(DigimarService.name);
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  // ── Cache ──
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = Number(process.env.TORIBIO_REFRESH_INTERVAL_MS) || 60_000;

  constructor() {
    this.spreadsheetId = process.env.TORIBIO_SPREADSHEET_ID || '1J1sdzYNVThhUGanHyYWETH6Lr3dlT77ckKZ5d89OEvU';
  }

  async onModuleInit() {
    await this.initializeSheetsClient();
  }

  // ── Auth: initialize Google Sheets API client ──

  private async initializeSheetsClient() {
    try {
      // Try loading from env vars first
      const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
      const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

      if (privateKey && clientEmail) {
        const auth = new google.auth.JWT({
          email: clientEmail,
          key: privateKey.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        this.logger.log('Google Sheets client initialized from env vars');
        return;
      }

      // Fallback: load JSON file
      const jsonPath = path.resolve(process.cwd(), 'dirlif-project-cbab4f5a2ec6.json');
      if (fs.existsSync(jsonPath)) {
        const credentials = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        this.logger.log('Google Sheets client initialized from JSON file');
        return;
      }

      // No credentials found — log warning and continue without sheets
      this.logger.warn(
        '⚠️  Google Sheets credentials not configured. ' +
        'Digimar Toribio dashboard will be unavailable until GOOGLE_SHEETS_PRIVATE_KEY ' +
        'and GOOGLE_SHEETS_CLIENT_EMAIL are set.'
      );
      this.sheets = null;
    } catch (err) {
      this.logger.warn('Google Sheets client initialization skipped (non-fatal):', err.message);
      this.sheets = null;
    }
  }

  // ── Generic cache wrapper ──

  private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  invalidateCache() {
    this.cache.clear();
    this.logger.log('Cache invalidated');
  }

  // ── Raw sheet reader ──

  private async readRange(range: string): Promise<string[][]> {
    if (!this.sheets) {
      this.logger.warn(`Google Sheets not initialized — cannot read range: ${range}`);
      return [];
    }
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range,
        valueRenderOption: 'UNFORMATTED_VALUE',
      });
      return response.data.values || [];
    } catch (err) {
      this.logger.error(`Failed to read range: ${range}`, err);
      return [];
    }
  }

  private async readSheetByName(sheetName: string): Promise<string[][]> {
    return this.readRange(`'${sheetName}'!A:Z`);
  }

  // ── Sheet names ──

  async getSheetNames(): Promise<string[]> {
    if (!this.sheets) {
      return [];
    }
    return this.getCached('sheetNames', async () => {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      return response.data.sheets?.map(s => s.properties?.title || '') || [];
    });
  }

  // ── Available months ──

  async getMonths(): Promise<string[]> {
    const summary = await this.getSummary();
    const months = summary.instagram.map(r => r.month).filter(Boolean);
    return months;
  }

  // ══════════════════════════════════════════════
  //  SUMMARY PERFORMANCE
  // ══════════════════════════════════════════════

  async getSummary(): Promise<SummaryData> {
    return this.getCached('summary', async () => {
      const rows = await this.readSheetByName('Summary Performance');
      if (rows.length < 46) {
        this.logger.warn(`Summary Performance sheet has only ${rows.length} rows, expected 46+`);
      }

      // ── Stories KPI (IG: R4-R15, TT: same rows but col K-P) ──
      const igStories: StoriesKpiRow[] = [];
      const ttStories: StoriesKpiRow[] = [];

      for (let i = 3; i < 15; i++) {  // R4-R15 (0-indexed: 3-14)
        const row = rows[i] || [];
        const month = str(row[0]);

        // Column layout: A=Month, B=(empty/merged), C=StoriesCreate, D=Growth%, E=TargetKPI%, F=AvgView, G=Growth%, H=TargetKPI%
        igStories.push({
          month,
          storiesCreate: num(row[2]),
          growthPct: pct(row[3]),
          targetKpiPct: pct(row[4]),
          averageView: num(row[5]),
          viewGrowthPct: pct(row[6]),
          viewTargetKpiPct: pct(row[7]),
        });

        ttStories.push({
          month,
          storiesCreate: num(row[10]), // col K = index 10
          growthPct: pct(row[11]),
          targetKpiPct: pct(row[12]),
          averageView: num(row[13]),
          viewGrowthPct: pct(row[14]),
          viewTargetKpiPct: pct(row[15]),
        });
      }

      const storiesKpi: StoriesKpi = {
        instagram: igStories,
        tiktok: ttStories,
      };

      // ── KPI Tracker IG (R20-R31, 0-indexed 19-30) ──
      const instagram: TrackerRow[] = [];
      for (let i = 19; i < 31; i++) {
        const row = rows[i] || [];
        instagram.push(this.parseTrackerRow(row, false));
      }

      // ── KPI Tracker TT (R35-R46, 0-indexed 34-45) ──
      const tiktok: TrackerRow[] = [];
      for (let i = 34; i < 46; i++) {
        const row = rows[i] || [];
        tiktok.push(this.parseTrackerRow(row, true));
      }

      return { storiesKpi, instagram, tiktok };
    });
  }

  private parseTrackerRow(row: string[], isTikTok: boolean): TrackerRow {
    return {
      month: str(row[0]),
      engagementRate: pct(row[1]),
      growthPct: pct(row[2]),
      targetKpiPct: pct(row[3]),
      totalFollowers: num(row[4]),
      followerGrowthPct: pct(row[5]),
      followerTargetKpiPct: pct(row[6]),
      unfollow: num(row[7]),
      unfollowGrowthPct: pct(row[8]),
      feedCreate: num(row[9]),
      feedGrowthPct: pct(row[10]),
      feedTargetKpiPct: pct(row[11]),
      totalPost: num(row[12]),
      totalReach: num(row[13]),
      like: num(row[14]),
      comment: num(row[15]),
      save: num(row[16]),
      share: num(row[17]),
      profileVisit: num(row[18]),
      er: pct(row[19]),
      followersGrowth: num(row[20]),
      leads: num(row[21]),
      samples: num(row[22]),
      spend: num(row[23]),
    };
  }

  // ══════════════════════════════════════════════
  //  PLATFORM WEEKLY
  // ══════════════════════════════════════════════

  async getWeekly(month?: string, platform?: string): Promise<WeeklyData> {
    return this.getCached(`weekly:${month || 'all'}:${platform || 'all'}`, async () => {
      const rows = await this.readSheetByName('Platform Weekly');
      // Skip header row (index 0)
      const dataRows = rows.slice(1).filter(r => r.length >= 2 && str(r[0]));

      let filtered = dataRows;
      if (month) {
        filtered = filtered.filter(r => str(r[0]).toLowerCase() === month.toLowerCase());
      }
      if (platform) {
        filtered = filtered.filter(r => str(r[1]).toLowerCase() === platform.toLowerCase());
      }

      const parsed: WeeklyRow[] = filtered.map(r => ({
        month: str(r[0]),
        platform: str(r[1]) as 'Instagram' | 'TikTok',
        week: str(r[2]),
        follow: num(r[3]),
        unfollow: num(r[4]),
        viewers: num(r[5]),
        profileVisit: num(r[6]),
        dm: num(r[7]),
        like: num(r[8]),
        save: num(r[9]),
        share: num(r[10]),
        storiesCount: num(r[11]),
        storiesViews: num(r[12]),
        leads: num(r[13]),
        notes: str(r[14]),
      }));

      return {
        rows: parsed,
        instagram: parsed.filter(r => r.platform === 'Instagram'),
        tiktok: parsed.filter(r => r.platform === 'TikTok'),
      };
    });
  }

  // ══════════════════════════════════════════════
  //  PAID ADS & RESULTS
  // ══════════════════════════════════════════════

  async getPaidAds(month?: string): Promise<PaidAdsData> {
    return this.getCached(`paidAds:${month || 'all'}`, async () => {
      const rows = await this.readSheetByName('Paid Ads and Results');
      const dataRows = rows.slice(1).filter(r => r.length >= 2 && str(r[0]));

      let filtered = dataRows;
      if (month) {
        filtered = filtered.filter(r => str(r[0]).toLowerCase() === month.toLowerCase());
      }

      const parsed: PaidAdsRow[] = filtered.map(r => ({
        month: str(r[0]),
        channel: str(r[1]),
        budget: num(r[2]),
        spentLeft: num(r[3]),
        spend: num(r[4]),
        traffic: num(r[5]),
        leads: num(r[6]),
        prospecting: num(r[7]),
        samples: num(r[8]),
        notes: str(r[9]),
      }));

      const totalBudget = parsed.reduce((sum, r) => sum + (r.budget || 0), 0);
      const totalSpend = parsed.reduce((sum, r) => sum + (r.spend || 0), 0);
      const totalLeads = parsed.reduce((sum, r) => sum + (r.leads || 0), 0);
      const totalSamples = parsed.reduce((sum, r) => sum + (r.samples || 0), 0);
      const totalTraffic = parsed.reduce((sum, r) => sum + (r.traffic || 0), 0);

      return {
        rows: parsed,
        totalBudget,
        totalSpend,
        totalLeads,
        totalSamples,
        totalTraffic,
        cpl: totalLeads > 0 ? totalSpend / totalLeads : null,
        cpa: totalSamples > 0 ? totalSpend / totalSamples : null,
      };
    });
  }

  // ══════════════════════════════════════════════
  //  CONTENT & POSTS
  // ══════════════════════════════════════════════

  async getContent(month?: string): Promise<ContentData> {
    return this.getCached(`content:${month || 'all'}`, async () => {
      const rows = await this.readSheetByName('Content and Posts');
      // Include rows even if month is empty (old data without month column)
      const dataRows = rows.slice(1).filter(r => r.length >= 4);

      let filtered = dataRows;
      if (month) {
        filtered = filtered.filter(r => str(r[0]).toLowerCase() === month.toLowerCase());
      }

      const parsed: ContentRow[] = filtered.map(r => ({
        month: str(r[0]),
        date: str(r[1]),
        day: str(r[2]),
        platform: str(r[3]),
        contentType: str(r[4]),
        category: str(r[5]),
        objective: str(r[6]),
        pic: str(r[7]),
        postUrl: str(r[8]),
        views: num(r[9]),
        likes: num(r[10]),
        comments: num(r[11]),
        saves: num(r[12]),
        copywriting: str(r[13]),
        hashtag: str(r[14]),
        contentBrief: str(r[15]),
        published: str(r[16]),
      }));

      // Best content: sort by engagement (likes + comments + saves) descending
      const withEngagement = parsed.map(c => ({
        ...c,
        engagement: (c.likes || 0) + (c.comments || 0) + (c.saves || 0),
      }));
      const bestContent = [...withEngagement]
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5)
        .map(({ engagement, ...rest }) => rest);

      return {
        rows: parsed,
        instagram: parsed.filter(r => r.platform.toLowerCase() === 'instagram'),
        tiktok: parsed.filter(r => r.platform.toLowerCase() === 'tiktok'),
        bestContent,
      };
    });
  }

  // ══════════════════════════════════════════════
  //  ALL-IN-ONE (for dashboard initial load)
  // ══════════════════════════════════════════════

  async getAll(month?: string): Promise<{
    summary: SummaryData;
    weekly: WeeklyData;
    paidAds: PaidAdsData;
    content: ContentData;
    months: string[];
  }> {
    const [summary, weekly, paidAds, content, months] = await Promise.all([
      this.getSummary(),
      this.getWeekly(month),
      this.getPaidAds(month),
      this.getContent(month),
      this.getMonths(),
    ]);
    return { summary, weekly, paidAds, content, months };
  }
}
