import { Injectable } from '@nestjs/common';

// Stub service — see Phase 0-5 report. Marketing module work does not
// call these methods. Real stock-intelligence logic is being rebuilt separately.
@Injectable()
export class StockIntelligenceService {
  async getABCAnalysis(): Promise<any[]> { return []; }
  async getDeadStockItems(): Promise<any[]> { return []; }
  async getFastMovers(_limit?: number): Promise<any[]> { return []; }
  async getSlowMovers(_days?: number): Promise<any[]> { return []; }
  async getReorderSuggestions(): Promise<any[]> { return []; }
  async getCriticalStockItems(): Promise<any[]> { return []; }
}
