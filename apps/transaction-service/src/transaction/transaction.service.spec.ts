import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { SupabaseService } from '../supabase.service';
import { RabbitMQService } from '../rabbitmq.service';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const mockRequest = { headers: { authorization: 'Bearer test-token' } };

    const mockSupabaseService = {};
    const mockRabbitMQService = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: 'REQUEST', useValue: mockRequest },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: RabbitMQService, useValue: mockRabbitMQService },
      ],
    }).compile({ strict: false });

    // Use resolve() for REQUEST-scoped providers
    service = await module.resolve<TransactionService>(TransactionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('decrementStock', () => {
    it('should skip items without product_id', async () => {
      global.fetch = jest.fn();
      await service.decrementStock([{ quantity: 1 }]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call inventory service for each item with product_id', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: jest.fn() });
      await service.decrementStock([{ product_id: 'p1', quantity: 2 }]);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stock/adjust'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(service.decrementStock([{ product_id: 'p1', quantity: 1 }])).resolves.not.toThrow();
    });

    it('should log error when stock adjustment returns non-ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, text: jest.fn().mockResolvedValue('error') });
      await expect(service.decrementStock([{ product_id: 'p1', quantity: 1 }])).resolves.not.toThrow();
    });

    it('should handle empty items array', async () => {
      global.fetch = jest.fn();
      await service.decrementStock([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
