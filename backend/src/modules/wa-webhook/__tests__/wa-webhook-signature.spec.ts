import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { WaWebhookController } from '../wa-webhook.controller';

describe('WaWebhookController Meta signature', () => {
  const oldSecret = process.env.META_APP_SECRET;
  const service: any = { handleIncoming: jest.fn().mockResolvedValue({ status: 'ok' }) };
  const controller = new WaWebhookController(service);
  const body = { object: 'whatsapp_business_account', entry: [] };
  const rawBody = Buffer.from(JSON.stringify(body));

  afterEach(() => {
    jest.clearAllMocks();
    if (oldSecret === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = oldSecret;
  });

  it('accepts the exact raw body signed with META_APP_SECRET', async () => {
    process.env.META_APP_SECRET = 'meta-test-secret';
    const signature = `sha256=${crypto.createHmac('sha256', process.env.META_APP_SECRET).update(rawBody).digest('hex')}`;
    await expect(controller.incoming(body, signature, { rawBody } as any)).resolves.toEqual({ status: 'ok' });
    expect(service.handleIncoming).toHaveBeenCalledWith(body);
  });

  it('rejects an invalid signature before processing', async () => {
    process.env.META_APP_SECRET = 'meta-test-secret';
    await expect(controller.incoming(body, 'sha256=invalid', { rawBody } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(service.handleIncoming).not.toHaveBeenCalled();
  });
});
