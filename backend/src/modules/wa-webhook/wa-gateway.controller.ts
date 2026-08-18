import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { WaWebhookService } from './wa-webhook.service';

/**
 * Webhook GATEWAY pihak ketiga (Wablas/Mesolitica/Fonnte, dll).
 * Path bersih: POST /wa-gateway/webhook (tidak di-prefix wa-webhook).
 */
@Controller('wa-gateway')
export class WaGatewayController {
  constructor(private readonly service: WaWebhookService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async gateway(@Body() body: any) {
    return this.service.handleGateway(body);
  }
}
