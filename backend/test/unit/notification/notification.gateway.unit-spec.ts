// Wave 3/D1 — NotificationGateway unit tests.
//
// 7 cases. We mock the Server/Socket (not a live socket.io connection) and
// verify the contract:
//   - handleConnection with valid JWT joins user.{userId} room
//   - handleConnection with no token / bad token disconnects
//   - handleConnection with inactive user disconnects
//   - onMention emits to user.{mentionedUserId} with envelope
//   - onApprovalGranted emits to user.{approverId}
//   - ring buffer replay fires on reconnect with lastEventId

import { NotificationGateway } from '../../../src/modules/notification/notification.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma/prisma/prisma.service';

function makeSocket(opts: {
  id?: string;
  handshake?: any;
  joinedRooms?: string[];
}) {
  const emit = jest.fn();
  const disconnect = jest.fn();
  const join = jest.fn((room: string) => {
    opts.joinedRooms?.push(room);
  });
  const data: Record<string, unknown> = {};
  return {
    id: opts.id ?? 'sock-1',
    handshake: opts.handshake ?? { auth: {}, headers: {} },
    data,
    emit,
    disconnect,
    join,
    // Track emitted events for replay assertions
    _emitted: [] as Array<{ event: string; payload: unknown }>,
  };
}

function makeServerMock() {
  const toEmit = jest.fn().mockReturnValue({ emit: jest.fn() });
  return {
    to: toEmit,
    emit: jest.fn(),
    _toEmit: toEmit,
  };
}

describe('NotificationGateway', () => {
  let jwt: jest.Mocked<JwtService>;
  let prisma: any;
  let server: ReturnType<typeof makeServerMock>;
  let gateway: NotificationGateway;

  beforeEach(() => {
    jwt = { verifyAsync: jest.fn() } as any;
    prisma = {
      user: { findUnique: jest.fn() },
    };
    server = makeServerMock();
    gateway = new NotificationGateway(jwt as any, prisma as any);
    gateway.server = server as any;
  });

  describe('handleConnection', () => {
    it('joins user.{userId} room when JWT is valid', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({ sub: 'u-1' });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u-1', status: 'ACTIVE' });
      const sock = makeSocket({
        handshake: { auth: { token: 'valid.jwt' }, headers: {} },
      });

      await gateway.handleConnection(sock as any);

      expect(sock.join).toHaveBeenCalledWith('user.u-1');
      expect(sock.disconnect).not.toHaveBeenCalled();
      expect(sock.emit).toHaveBeenCalledWith('connected', expect.objectContaining({ userId: 'u-1' }));
    });

    it('disconnects on missing token', async () => {
      const sock = makeSocket({ handshake: { auth: {}, headers: {} } });
      await gateway.handleConnection(sock as any);
      expect(sock.disconnect).toHaveBeenCalledWith(true);
      expect(sock.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'UNAUTHENTICATED' }));
    });

    it('disconnects on bad token', async () => {
      jwt.verifyAsync.mockRejectedValueOnce(new Error('bad signature'));
      const sock = makeSocket({
        handshake: { auth: { token: 'bad.jwt' }, headers: {} },
      });
      await gateway.handleConnection(sock as any);
      expect(sock.disconnect).toHaveBeenCalledWith(true);
      expect(sock.emit).toHaveBeenCalledWith('error', expect.objectContaining({ code: 'INVALID_TOKEN' }));
    });

    it('disconnects inactive users', async () => {
      jwt.verifyAsync.mockResolvedValueOnce({ sub: 'u-1' });
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u-1', status: 'INACTIVE' });
      const sock = makeSocket({
        handshake: { auth: { token: 'valid.jwt' }, headers: {} },
      });
      await gateway.handleConnection(sock as any);
      expect(sock.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('event subscriptions', () => {
    it('onMention emits to user.{mentionedUserId}', () => {
      gateway.onMention({
        replyId: 'r-1',
        threadId: 't-1',
        authorId: 'u-1',
        mentionedUserId: 'u-2',
        mentionId: 'm-1',
        createdAt: new Date(),
      });
      expect(server.to).toHaveBeenCalledWith('user.u-2');
      expect(server.to('user.u-2').emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({ type: 'mention' }),
      );
    });

    it('onApprovalGranted emits to user.{approverId}', () => {
      gateway.onApprovalGranted({
        entityType: 'SALES_ORDER',
        entityId: 'so-1',
        approverId: 'u-9',
        reason: 'ok',
        emittedAt: new Date().toISOString(),
      });
      expect(server.to).toHaveBeenCalledWith('user.u-9');
      expect(server.to('user.u-9').emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({ type: 'approval' }),
      );
    });

    it('onApprovalGranted skips when approverId missing', () => {
      gateway.onApprovalGranted({
        entityType: 'X',
        entityId: '1',
        approverId: null,
        emittedAt: new Date().toISOString(),
      });
      expect(server.to).not.toHaveBeenCalled();
    });
  });

  describe('ring buffer replay', () => {
    it('replays missed events on reconnect with lastEventId', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'u-1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'u-1', status: 'ACTIVE' });

      // First connection: receive 2 mentions, capture envelope IDs.
      const sock1 = makeSocket({
        id: 'sock-first',
        handshake: { auth: { token: 'valid.jwt' }, headers: {} },
      });
      await gateway.handleConnection(sock1 as any);

      gateway.onMention({
        replyId: 'r-1',
        threadId: 't-1',
        authorId: 'u-author',
        mentionedUserId: 'u-1',
        mentionId: 'm-A',
      });
      gateway.onMention({
        replyId: 'r-2',
        threadId: 't-2',
        authorId: 'u-author',
        mentionedUserId: 'u-1',
        mentionId: 'm-B',
      });

      // Read the ring buffer for u-1 — lastEventId of "m-A_*" should replay
      // only the second event.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ring: any[] = (gateway as any).ringByUser.get('u-1') ?? [];
      expect(ring.length).toBe(2);
      const lastEventId = ring[0].id;

      // Second connection with lastEventId.
      const sock2 = makeSocket({
        id: 'sock-second',
        handshake: { auth: { token: 'valid.jwt', lastEventId }, headers: {} },
      });
      const replayEmits = sock2.emit as jest.Mock;
      await gateway.handleConnection(sock2 as any);

      // Replayed event(s) should be emitted to the second socket.
      const replayCalls = replayEmits.mock.calls.filter(
        ([event]: [string]) => event === 'notification',
      );
      expect(replayCalls).toHaveLength(1);
      expect((replayCalls[0][1] as any).type).toBe('mention');
    });
  });
});
