import { Test, TestingModule } from '@nestjs/testing';
import { ReportingController } from './reporting.controller';
import { SupabaseService } from '../supabase.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('ReportingController', () => {
  let controller: ReportingController;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      in: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    };
    // Make insert chainable and resolve
    mockClient.insert.mockResolvedValue({ error: null });

    const mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [{ provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile();

    controller = module.get<ReportingController>(ReportingController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  describe('getActivityLogs', () => {
    it('should return logs on success', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: [{ id: 1 }], error: null });
      const result = await controller.getActivityLogs();
      expect(result.logs).toHaveLength(1);
    });

    it('should return empty array when no logs', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: null, error: null });
      const result = await controller.getActivityLogs();
      expect(result.logs).toEqual([]);
    });

    it('should throw InternalServerErrorException on db error', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
      await expect(controller.getActivityLogs()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createActivityLog', () => {
    it('should return success on log creation', async () => {
      const result = await controller.createActivityLog({
        userId: 'u1', userEmail: 'a@b.com', actionType: 'LOGIN', actionDetails: 'logged in', entityType: 'user', entityId: 'u1'
      });
      expect(result.success).toBe(true);
    });

    it('should throw InternalServerErrorException on db error', async () => {
      mockClient.insert.mockResolvedValueOnce({ error: { message: 'Insert error' } });
      await expect(controller.createActivityLog({
        userId: 'u1', userEmail: 'a@b.com', actionType: 'LOGIN', actionDetails: 'logged in', entityType: 'user', entityId: 'u1'
      })).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getShiftRecords', () => {
    it('should return shift records on success', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: [{ id: 1, clock_in_at: new Date().toISOString() }], error: null });
      const result = await controller.getShiftRecords();
      expect(result.records).toHaveLength(1);
    });

    it('should throw InternalServerErrorException on db error', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
      await expect(controller.getShiftRecords()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getMarketBasketRules', () => {
    it('should return message if no multi-item baskets', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: [], error: null });
      const result = await controller.getMarketBasketRules();
      expect((result as any).message).toContain('Not enough');
    });

    it('should return frequent itemsets from multi-item baskets', async () => {
      // Provide enough transactions to exceed the 5% threshold
      const txns = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        transaction_items: [{ name: 'Paracetamol' }, { name: 'Biogesic' }],
      }));
      mockClient.limit.mockResolvedValueOnce({ data: txns, error: null });
      const result = await controller.getMarketBasketRules('0.05');
      expect((result as any).frequentItemsets.length).toBeGreaterThan(0);
    });

    it('should throw InternalServerErrorException on db error', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
      await expect(controller.getMarketBasketRules()).rejects.toThrow(InternalServerErrorException);
    });

    it('should use default 5% support when no support param given', async () => {
      mockClient.limit.mockResolvedValueOnce({ data: [], error: null });
      const result = await controller.getMarketBasketRules();
      expect((result as any).totalTransactionsAnalyzed).toBe(0);
    });
  });
});
