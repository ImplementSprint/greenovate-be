import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { SupabaseService } from './supabase.service';
import { MailerService } from './mailer.service';
import { ApiCenterService } from './api-center.service';

// Mock the http utilities
jest.mock('../shared/http/request-downstream', () => ({
  requestDownstream: jest.fn(),
}));

import { requestDownstream } from '../shared/http/request-downstream';

describe('OrderService', () => {
  let service: OrderService;
  let mockDb: any;

  beforeEach(async () => {
    const chainedQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
    };

    mockDb = {
      from: jest.fn().mockReturnValue(chainedQuery),
      rpc: jest.fn().mockResolvedValue({ data: { receipt_id: 1, receipt_number: 'RCP-001' }, error: null }),
    };

    const mockSupabaseService = {
      supabase: mockDb,
      supabaseAdmin: mockDb,
    };

    const mockMailerService = {
      isConfigured: jest.fn().mockReturnValue(false),
      sendOrderConfirmationEmail: jest.fn().mockResolvedValue(undefined),
      sendOrderCancellationEmail: jest.fn().mockResolvedValue(undefined),
      sendReturnRequestEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockApiCenterService = {
      isConfigured: jest.fn().mockReturnValue(false),
      paymentCreateCheckoutSession: jest.fn(),
      paymentGetCheckoutStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: ApiCenterService, useValue: mockApiCenterService },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('listCustomerOrders', () => {
    it('should return empty array when no orders found', async () => {
      mockDb.from().limit.mockResolvedValue({ data: [], error: null });
      const result = await service.listCustomerOrders('user-1');
      expect(result).toEqual([]);
    });

    it('should throw on db error', async () => {
      mockDb.from().limit.mockResolvedValue({ data: null, error: new Error('DB error') });
      await expect(service.listCustomerOrders('user-1')).rejects.toThrow();
    });
  });

  describe('adminListAllOrders', () => {
    it('should return empty data on error', async () => {
      mockDb.from().range.mockResolvedValue({ data: null, error: new Error('DB error'), count: null });
      const result = await service.adminListAllOrders();
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('adminUpdateOrderStatus', () => {
    it('should return error if order not found', async () => {
      mockDb.from().single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const result = await service.adminUpdateOrderStatus('RCP-001', 'Delivered');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('search', () => {
    it('should return empty array when no results', async () => {
      mockDb.from().limit.mockResolvedValue({ data: [], error: null });
      const result = await service.search();
      expect(result).toEqual([]);
    });

    it('should throw on db error', async () => {
      mockDb.from().limit.mockResolvedValue({ data: null, error: new Error('Search error') });
      await expect(service.search()).rejects.toThrow();
    });
  });

  describe('submitReturnRequest', () => {
    it('should return error if order not found', async () => {
      mockDb.from().single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const result = await service.submitReturnRequest('u1', 'e@b.com', 'RCP-001', 'damaged', undefined, []);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('should return error if order does not belong to user', async () => {
      mockDb.from().single.mockResolvedValueOnce({ data: { id: 1, customer_id: 'other-user', fulfillment_status: 'Delivered', receipt_number: 'RCP-001' }, error: null });
      const result = await service.submitReturnRequest('u1', 'e@b.com', 'RCP-001', 'damaged', undefined, []);
      expect(result.success).toBe(false);
    });

    it('should return error if order is not Delivered', async () => {
      mockDb.from().single.mockResolvedValueOnce({ data: { id: 1, customer_id: 'u1', fulfillment_status: 'Processing', receipt_number: 'RCP-001' }, error: null });
      const result = await service.submitReturnRequest('u1', 'e@b.com', 'RCP-001', 'damaged', undefined, []);
      expect(result.success).toBe(false);
      expect(result.error).toContain('delivered');
    });
  });

  describe('cancelOrder', () => {
    it('should return error if order not found', async () => {
      mockDb.from().single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const result = await service.cancelOrder('u1', 'RCP-001');
      expect(result.success).toBe(false);
    });

    it('should return error if order is not Processing', async () => {
      mockDb.from().single.mockResolvedValueOnce({ data: { id: 1, customer_id: 'u1', fulfillment_status: 'Delivered', receipt_number: 'RCP-001', transaction_id: null, created_at: new Date().toISOString(), total: 100, shipping_address: '123 St', payment_method: 'Cash', online_order_items: [] }, error: null });
      const result = await service.cancelOrder('u1', 'RCP-001');
      expect(result.success).toBe(false);
    });
  });

  describe('placeOrder', () => {
    it('should return error if shipping address is missing', async () => {
      const result = await service.placeOrder('u1', { items: [{ id: '1', quantity: 1 }], shippingAddress: '' });
      expect((result as any).error).toContain('Shipping address');
    });

    it('should return error if cart is empty', async () => {
      const result = await service.placeOrder('u1', { items: [], shippingAddress: '123 St' });
      expect((result as any).error).toContain('empty');
    });

    it('should return error if product is missing', async () => {
      (requestDownstream as jest.Mock).mockResolvedValue({
        status: 200,
        data: { items: [{ id: '1', status: 'missing' }] },
      });
      const result = await service.placeOrder('u1', { items: [{ id: '1', quantity: 1 }], shippingAddress: '123 St' });
      expect((result as any).error).toContain('not found');
    });

    it('should return error if product has insufficient stock', async () => {
      (requestDownstream as jest.Mock).mockResolvedValue({
        status: 200,
        data: { items: [{ id: '1', name: 'Product A', status: 'insufficient-stock', availableStock: 0 }] },
      });
      const result = await service.placeOrder('u1', { items: [{ id: '1', quantity: 1 }], shippingAddress: '123 St' });
      expect((result as any).status).toBe(409);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return failed if order not found', async () => {
      mockDb.from().single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const result = await service.getPaymentStatus('RCP-001');
      expect(result.status).toBe('failed');
    });

    it('should return paid if payment_status is paid', async () => {
      mockDb.from().single.mockResolvedValue({ data: { id: 1, payment_status: 'paid', receipt_number: 'RCP-001', order_number: 'TXN-1', total: 100, shipping_address: '123 St', payment_method: 'Cash' }, error: null });
      const result = await service.getPaymentStatus('RCP-001');
      expect(result.status).toBe('paid');
    });
  });

  describe('cancelPendingPayment', () => {
    it('should return error if order not found', async () => {
      mockDb.from().single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      const result = await service.cancelPendingPayment('u1', 'RCP-001');
      expect(result.success).toBe(false);
    });

    it('should return error if user is not the owner', async () => {
      mockDb.from().single.mockResolvedValue({ data: { id: 1, customer_id: 'other', payment_status: 'pending', fulfillment_status: 'Processing', transaction_id: null, online_order_items: [] }, error: null });
      const result = await service.cancelPendingPayment('u1', 'RCP-001');
      expect(result.success).toBe(false);
    });

    it('should return error if order is not pending payment', async () => {
      mockDb.from().single.mockResolvedValue({ data: { id: 1, customer_id: 'u1', payment_status: 'paid', fulfillment_status: 'Processing', transaction_id: null, online_order_items: [] }, error: null });
      const result = await service.cancelPendingPayment('u1', 'RCP-001');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not awaiting payment');
    });
  });
});
