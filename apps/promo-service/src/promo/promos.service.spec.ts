import { Test, TestingModule } from '@nestjs/testing';
import { PromosService } from './promos.service';
import { SupabaseService } from './supabase.service';

describe('PromosService', () => {
  let service: PromosService;
  let mockDb: any;

  const makePromoData = (overrides = {}) => ({
    id: 1, code: 'PROMO10', description: 'Test promo', discount_type: 'fixed', discount_value: 10,
    min_subtotal: 0, max_discount: null, starts_at: null, ends_at: null,
    usage_limit: null, times_used: 0, is_active: true, ...overrides,
  });

  beforeEach(async () => {
    mockDb = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      }),
      maybeSingle: jest.fn().mockResolvedValue({ data: makePromoData(), error: null }),
    };

    const mockSupabaseService = {
      secondSupabaseAdmin: {
        from: jest.fn().mockReturnValue(mockDb),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromosService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<PromosService>(PromosService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('normalizePromoCode', () => {
    it('should uppercase and trim code', () => {
      expect(service.normalizePromoCode('  promo10  ')).toBe('PROMO10');
    });
  });

  describe('validatePromoCode', () => {
    it('should return invalid if code is empty', async () => {
      const result = await service.validatePromoCode('', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('promo code');
    });

    it('should return invalid if promo not found', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      const result = await service.validatePromoCode('INVALID', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should return invalid if promo is inactive', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ is_active: false }), error: null });
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('inactive');
    });

    it('should return invalid if promo not started yet', async () => {
      const future = new Date(Date.now() + 100000).toISOString();
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ starts_at: future }), error: null });
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('not active yet');
    });

    it('should return invalid if promo has expired', async () => {
      const past = new Date(Date.now() - 100000).toISOString();
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ ends_at: past }), error: null });
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should return invalid if usage limit reached', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ usage_limit: 5, times_used: 5 }), error: null });
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('usage limit');
    });

    it('should return invalid if subtotal is below minimum', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ min_subtotal: 200 }), error: null });
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Minimum subtotal');
    });

    it('should return valid with fixed discount', async () => {
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.discountAmount).toBe(10);
        expect(result.message).toContain('PROMO10');
      }
    });

    it('should return valid with percent discount', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ discount_type: 'percent', discount_value: 20, max_discount: null }), error: null });
      const result = await service.validatePromoCode('PROMO10', 100);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.discountAmount).toBe(20);
      }
    });

    it('should cap percent discount at max_discount', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: makePromoData({ discount_type: 'percent', discount_value: 50, max_discount: 30 }), error: null });
      const result = await service.validatePromoCode('PROMO10', 200);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.discountAmount).toBe(30); // 50% of 200 = 100, capped at 30
      }
    });

    it('should throw if db returns error', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } });
      await expect(service.validatePromoCode('PROMO10', 100)).rejects.toThrow('Failed to validate promo code.');
    });
  });

  describe('incrementPromoUsage', () => {
    it('should increment promo usage count', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: { id: 1, times_used: 3 }, error: null });
      await expect(service.incrementPromoUsage(1)).resolves.not.toThrow();
    });

    it('should throw if promo not found', async () => {
      mockDb.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      await expect(service.incrementPromoUsage(99)).rejects.toThrow('Promo code not found.');
    });
  });
});
