import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface VercelProject {
  id: string;
  projectId: string;
  projectName: string;
  deployUrl: string;
  connectedAt: string;
  lastVerified: string;
  status: 'connected' | 'error';
}

@Injectable()
export class VercelTrackerService {
  private readonly logger = new Logger(VercelTrackerService.name);
  private readonly dataPath: string;
  private projects: VercelProject[] = [];

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'vercel-projects.json');
    this.loadProjects();
  }

  private loadProjects() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        this.projects = JSON.parse(data);
        this.logger.log(`Loaded ${this.projects.length} Vercel projects`);
      }
    } catch (err) {
      this.logger.error('Failed to load Vercel projects:', err);
      this.projects = [];
    }
  }

  private saveProjects() {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.projects, null, 2));
    } catch (err) {
      this.logger.error('Failed to save Vercel projects:', err);
    }
  }

  async connectProject(data: {
    projectId: string;
    projectName?: string;
    deployUrl?: string;
  }) {
    const existing = this.projects.find((p) => p.projectId === data.projectId);
    if (existing) {
      existing.projectName = data.projectName || existing.projectName;
      existing.deployUrl = data.deployUrl || existing.deployUrl;
      existing.lastVerified = new Date().toISOString();
      existing.status = 'connected';
    } else {
      this.projects.push({
        id: `vercel-${Date.now()}`,
        projectId: data.projectId,
        projectName: data.projectName || data.projectId,
        deployUrl: data.deployUrl || `https://${data.projectId}.vercel.app`,
        connectedAt: new Date().toISOString(),
        lastVerified: new Date().toISOString(),
        status: 'connected',
      });
    }
    this.saveProjects();
    return { success: true, projects: this.projects };
  }

  async disconnectProject(projectId: string) {
    this.projects = this.projects.filter((p) => p.projectId !== projectId);
    this.saveProjects();
    return { success: true, projects: this.projects };
  }

  async getProjects() {
    return this.projects;
  }

  async getTrackedUrls(): Promise<string[]> {
    const urls: string[] = [];
    for (const p of this.projects) {
      if (p.deployUrl) urls.push(p.deployUrl);
      urls.push(`https://${p.projectId}.vercel.app`);
    }
    return urls;
  }
}
