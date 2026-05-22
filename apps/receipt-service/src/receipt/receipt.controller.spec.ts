import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptController } from './receipt.controller';
import { SupabaseService } from '../supabase.service';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('ReceiptController', () => {
  let controller: ReceiptController;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000001' }, error: null }),
    };

    const mockSupabaseService = { getClient: jest.fn().mockReturnValue(mockClient) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceiptController],
      providers: [{ provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile();

    controller = module.get<ReceiptController>(ReceiptController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  describe('printReceipt', () => {
    it('should return success with receipt number', () => {
      const result = controller.printReceipt({
        receiptNumber: 'RCP-001',
        items: [{ name: 'Paracetamol', qty: 1, price: 10 }],
        vatable: 10,
        vatAmount: 1.2,
        total: 11.2,
        splitPayments: [],
      });
      expect(result.success).toBe(true);
      expect(result.receiptNumber).toBe('RCP-001');
    });

    it('should handle split payments', () => {
      const result = controller.printReceipt({
        receiptNumber: 'RCP-002',
        items: [],
        vatable: 0,
        vatAmount: 0,
        total: 100,
        splitPayments: [
          { method: 'cash', amount: '50' },
          { method: 'card', amount: '50', refNo: 'REF1', cardLast4: '1234' },
          { method: 'mobile', amount: '50', mobileProvider: 'GCash', refNo: 'REF2' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should handle missing receipt number gracefully', () => {
      const result = controller.printReceipt({
        items: [],
        vatable: 0,
        vatAmount: 0,
        total: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getReceipt', () => {
    it('should throw BadRequestException for invalid transactionId', async () => {
      await expect(controller.getReceipt('not-a-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should return receipt for valid transactionId', async () => {
      const result = await controller.getReceipt('00000000-0000-0000-0000-000000000001');
      expect(result.receipt).toBeDefined();
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockClient.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      await expect(controller.getReceipt('00000000-0000-0000-0000-000000000001')).rejects.toThrow(NotFoundException);
    });
  });
});
