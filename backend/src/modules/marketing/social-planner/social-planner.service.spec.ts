import { ConflictException } from '@nestjs/common';
import { SocialPlannerService } from './social-planner.service';

function postFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    title: 'Post Title',
    platform: 'instagram',
    contentType: 'single_post',
    status: 'idea',
    canonicalStatus: 'IDEA',
    version: 1,
    scheduledDate: null,
    publishedDate: null,
    pillar: 'Educational',
    caption: 'Sample caption',
    hooks: ['Hook 1'],
    cta: 'Click link in bio',
    hashtags: ['#marketing'],
    coverImage: null,
    mediaUrls: [],
    authorName: 'Marketing Team',
    authorAvatar: null,
    authorRole: 'Content Creator',
    brandId: null,
    assigneeId: null,
    reviewerId: null,
    brief: 'Creative brief',
    referenceUrl: 'https://example.com',
    reach: 0,
    impressions: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    videoViews: 0,
    clicks: 0,
    engagementRate: 0,
    viralityScore: 0,
    costPerResult: 0,
    checklist: [],
    media: [],
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-10'),
    ...overrides,
  };
}

describe('SocialPlannerService', () => {
  let service: SocialPlannerService;
  let prismaMock: any;
  let canonicalMock: any;

  beforeEach(() => {
    prismaMock = {
      socialPost: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      socialChecklistItem: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      socialPostMetricSnapshot: {
        create: jest.fn().mockResolvedValue({ id: 'snapshot-1' }),
      },
      marketingBrand: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };
    canonicalMock = {
      runIdempotent: jest.fn(),
    };
    service = new SocialPlannerService(prismaMock, canonicalMock);
  });

  const viewer = {
    id: 'user-1',
    userId: 'user-1',
    email: 'marketer@dreamlab.id',
    roles: ['MARKETING'],
  };

  it('updates post performance and auto-calculates engagementRate', async () => {
    const existing = postFixture();
    prismaMock.socialPost.findUnique
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce({
        ...existing,
        reach: 1000,
        impressions: 1200,
        likes: 60,
        comments: 10,
        shares: 5,
        saves: 25,
        engagementRate: 8.33,
        version: 2,
      });
    prismaMock.socialPost.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.updatePost(viewer, 'post-1', {
      version: 1,
      performance: {
        reach: 1000,
        impressions: 1200,
        likes: 60,
        comments: 10,
        shares: 5,
        saves: 25,
      },
    });

    expect(prismaMock.socialPost.updateMany).toHaveBeenCalledWith({
      where: { id: 'post-1', version: 1 },
      data: expect.objectContaining({
        reach: 1000,
        impressions: 1200,
        likes: 60,
        comments: 10,
        shares: 5,
        saves: 25,
        engagementRate: 8.33,
      }),
    });
    expect(prismaMock.socialPostMetricSnapshot.create).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.post.performance.engagementRate).toBe(8.33);
  });

  it('throws ConflictException on version conflict', async () => {
    const existing = postFixture({ version: 2 });
    prismaMock.socialPost.findUnique.mockResolvedValue(existing);
    prismaMock.socialPost.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updatePost(viewer, 'post-1', {
        version: 1,
        title: 'New Title',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
