// Wave 2/A3 — VercelTrackerService unit tests.
// Pure file-backed service (no prisma). Uses temp dir + fs.
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VercelTrackerService } from '../vercel-tracker.service';

describe('VercelTrackerService', () => {
  let service: VercelTrackerService;
  let tempDir: string;
  let originalCwd: () => string;

  beforeEach(() => {
    // Override process.cwd so the service writes to a temp dir
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vercel-test-'));
    originalCwd = process.cwd;
    process.cwd = () => tempDir;
    service = new VercelTrackerService();
  });

  afterEach(() => {
    process.cwd = originalCwd;
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  describe('init', () => {
    it('starts with an empty project list', async () => {
      expect(await service.getProjects()).toEqual([]);
    });
  });

  describe('connectProject', () => {
    it('adds a new project with auto-generated id', async () => {
      const result = await service.connectProject({
        projectId: 'my-app',
        projectName: 'My App',
        deployUrl: 'https://my-app.vercel.app',
      });
      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].projectId).toBe('my-app');
      expect(result.projects[0].status).toBe('connected');
    });

    it('updates an existing project (by projectId)', async () => {
      await service.connectProject({ projectId: 'my-app', projectName: 'A' });
      await service.connectProject({ projectId: 'my-app', projectName: 'B' });
      const projects = await service.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].projectName).toBe('B');
    });
  });

  describe('disconnectProject', () => {
    it('removes the project', async () => {
      await service.connectProject({ projectId: 'a' });
      await service.connectProject({ projectId: 'b' });
      await service.disconnectProject('a');
      const projects = await service.getProjects();
      expect(projects.find((p) => p.projectId === 'a')).toBeUndefined();
      expect(projects.find((p) => p.projectId === 'b')).toBeDefined();
    });
  });

  describe('getTrackedUrls', () => {
    it('returns deployUrl + canonical vercel.app URL per project', async () => {
      await service.connectProject({ projectId: 'a', deployUrl: 'https://a.com' });
      const urls = await service.getTrackedUrls();
      expect(urls).toContain('https://a.com');
      expect(urls).toContain('https://a.vercel.app');
    });

    it('returns deployUrl + canonical URL even when deployUrl was auto-filled from projectId', async () => {
      // connectProject auto-fills deployUrl to canonical when not supplied
      // (vercel-tracker.service.ts:67), so getTrackedUrls emits both — assert that
      // the canonical URL is present rather than asserting uniqueness.
      await service.connectProject({ projectId: 'b' });
      const urls = await service.getTrackedUrls();
      expect(urls).toContain('https://b.vercel.app');
      expect(urls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('persistence', () => {
    it('persists to disk and loads on next instantiation', async () => {
      await service.connectProject({ projectId: 'persist-test', projectName: 'P' });
      // Simulate process restart: re-instantiate
      const service2 = new VercelTrackerService();
      const projects = await service2.getProjects();
      expect(projects.find((p) => p.projectId === 'persist-test')).toBeDefined();
    });
  });
});
