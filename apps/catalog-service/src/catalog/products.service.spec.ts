import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { SupabaseService } from './supabase.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let supabaseService: SupabaseService;

  beforeEach(async () => {
    const mockSupabaseQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Product A', price: 10, stock: 5, category: 'Electronics', low_stock_threshold: 2 },
          { id: 2, name: 'Product B', price: 20, stock: 0, category: 'Clothing' },
          { id: 3, name: 'Controlled Drug', price: 50, stock: 10, category: 'Prescription' }
        ],
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    const mockSupabaseService = {
      secondSupabase: {
        from: jest.fn().mockReturnValue(mockSupabaseQuery),
      },
      secondSupabaseAdmin: {
        from: jest.fn().mockReturnValue(mockSupabaseQuery),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    supabaseService = module.get<SupabaseService>(SupabaseService);

    // Mock fetch to avoid network requests
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [{ product_id: '1', sold: 10 }] }),
      } as Response)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queryProducts', () => {
    it('should return products excluding prescription categories', async () => {
      const result = await service.queryProducts();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Product A');
      // Product 3 is prescription and should be stripped
    });

    it('should filter by category', async () => {
      const result = await service.queryProducts({ category: 'Clothing' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Product B');
    });

    it('should filter by minPrice and maxPrice', async () => {
      const result = await service.queryProducts({ minPrice: 15, maxPrice: 25 });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Product B');
    });

    it('should filter by inStockOnly', async () => {
      const result = await service.queryProducts({ inStockOnly: true });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Product A');
    });

    it('should search by name', async () => {
      const result = await service.queryProducts({ q: 'product a' });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Product A');
    });

    it('should sort by price ascending', async () => {
      const result = await service.queryProducts({ sortBy: 'price-asc' });
      expect(result[0].price).toBe(10);
      expect(result[1].price).toBe(20);
    });

    it('should sort by popularity (sold counts)', async () => {
      const result = await service.queryProducts({ sortBy: 'popularity' });
      expect(result[0].name).toBe('Product A'); // Sold 10 based on our mock
      expect(result[0].sold).toBe(10);
    });
  });

  describe('getProductsByIds', () => {
    it('should return matched products', async () => {
      const result = await service.getProductsByIds(['1']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty if empty array is provided', async () => {
      const result = await service.getProductsByIds([]);
      expect(result.length).toBe(0);
    });
  });

  describe('updateStock', () => {
    it('should call supabaseAdmin update and clear cache', async () => {
      await service.updateStock('1', 50);
      expect(supabaseService.secondSupabaseAdmin.from).toHaveBeenCalledWith('products');
      // Ensure catalogCache was nullified by checking fetch calls again
      const fetchSpy = jest.spyOn(service as any, 'loadCatalogProducts');
      await service.queryProducts();
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should throw error for invalid id', async () => {
      await expect(service.updateStock('invalid', 50)).rejects.toThrow('Invalid product id');
    });
  });
});
