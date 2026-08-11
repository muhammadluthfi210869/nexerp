import { Controller, Get, Post, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WaWebhookService } from './wa-webhook.service';

@Controller('wa-webhook')
export class WaWebhookController {
  constructor(private readonly service: WaWebhookService) {}

  /**
   * GET — dipanggil Meta untuk verifikasi webhook
   * Required params: hub.mode, hub.verify_token, hub.challenge
   */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const result = this.service.verifyToken(mode, token, challenge);
    if (result) {
      return result; // Return challenge string (Meta expects plain text)
    }
    return { error: 'Verification failed' };
  }

  /**
   * POST — menerima pesan masuk dari WhatsApp Cloud API
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async incoming(@Body() body: any) {
    return this.service.handleIncoming(body);
  }

  /**
   * POST /wa-gateway/webhook — menerima webhook dari GATEWAY pihak ketiga
   * (Wablas, Mesolitica, Fonnte, dll). Format payload fleksibel.
   */
  @Post('wa-gateway/webhook')
  @HttpCode(HttpStatus.OK)
  async gateway(@Body() body: any) {
    return this.service.handleGateway(body);
  }
}