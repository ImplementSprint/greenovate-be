import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { SupabaseService } from './supabase.service';
import { ProductsService } from './products.service';

describe('CartService', () => {
  let service: CartService;
  let mockCartClient: any;
  let mockProductsService: any;

  beforeEach(async () => {
    mockCartClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
    };
    // Make delete().eq() resolve
    mockCartClient.delete.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

    const mockSupabaseService = {
      getClientForService: jest.fn().mockReturnValue(mockCartClient),
      getClient: jest.fn().mockReturnValue(mockCartClient),
    };

    mockProductsService = {
      getProductsByIds: jest.fn().mockResolvedValue([
        { id: '1', name: 'Product A', price: 10, stock: 5, category: 'Electronics', image: '', description: 'A great product', sold: 0 },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(service).toBeDefined());

  describe('getCart', () => {
    it('should return empty array when cart is empty', async () => {
      mockCartClient.order.mockResolvedValueOnce({ data: [], error: null });
      const result = await service.getCart('user-1');
      expect(result).toEqual([]);
    });

    it('should return merged cart items with product info', async () => {
      mockCartClient.order.mockResolvedValueOnce({ data: [{ product_id: '1', quantity: 2, created_at: new Date().toISOString() }], error: null });
      const result = await service.getCart('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product A');
      expect(result[0].quantity).toBe(2);
    });

    it('should clamp quantity to stock', async () => {
      mockCartClient.order.mockResolvedValueOnce({ data: [{ product_id: '1', quantity: 100, created_at: new Date().toISOString() }], error: null });
      const result = await service.getCart('user-1');
      // Stock is 5, quantity should be clamped to 5
      expect(result[0].quantity).toBe(5);
    });

    it('should throw on db error', async () => {
      mockCartClient.order.mockResolvedValueOnce({ data: null, error: new Error('DB error') });
      await expect(service.getCart('user-1')).rejects.toThrow();
    });
  });

  describe('replaceCart', () => {
    it('should delete old cart and insert new items', async () => {
      await service.replaceCart('user-1', [{ id: '1', quantity: 2 }]);
      expect(mockCartClient.delete).toHaveBeenCalled();
      expect(mockCartClient.insert).toHaveBeenCalled();
    });

    it('should handle empty cart payload gracefully', async () => {
      await expect(service.replaceCart('user-1', [])).resolves.not.toThrow();
    });
  });

  describe('clearCart', () => {
    it('should delete all cart items for user', async () => {
      await service.clearCart('user-1');
      expect(mockCartClient.delete).toHaveBeenCalled();
    });
  });
});
