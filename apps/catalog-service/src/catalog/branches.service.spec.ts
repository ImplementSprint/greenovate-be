import { Test, TestingModule } from '@nestjs/testing';
import { BranchesService } from './branches.service';
import { SupabaseService } from './supabase.service';

describe('BranchesService', () => {
  let service: BranchesService;
  let supabaseService: SupabaseService;

  beforeEach(async () => {
    const mockSupabaseQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { id: 1, branch_name: 'Branch 1', address: '123 Test St', is_active: true }
        ],
        error: null,
      }),
    };

    const mockSupabaseAdminQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { branch_id: '1', product_id: '10', stock: 100 }
        ],
        error: null,
      }),
    };

    const mockSupabaseService = {
      secondSupabase: {
        from: jest.fn().mockReturnValue(mockSupabaseQuery),
      },
      secondSupabaseAdmin: {
        from: jest.fn().mockImplementation((table) => {
          if (table === 'storebranches') return mockSupabaseQuery;
          return mockSupabaseAdminQuery;
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    supabaseService = module.get<SupabaseService>(SupabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBranches', () => {
    it('should return normalized branches', async () => {
      const result = await service.getBranches();
      expect(result.length).toBe(1);
      expect((result[0] as any).id).toBe(1);
      expect((result[0] as any).name).toBe('Branch 1');
    });

    it('should return cached branches on second call', async () => {
      await service.getBranches();
      const result2 = await service.getBranches();
      expect(result2.length).toBe(1);
    });
  });

  describe('getInventory', () => {
    it('should return branch inventory', async () => {
      const result = await service.getInventory('1');
      expect(result.length).toBe(1);
      expect(result[0].branch_id).toBe('1');
    });

    it('should handle errors returning empty array', async () => {
      jest.spyOn(supabaseService.secondSupabaseAdmin.from('branch_inventory').select('*'), 'eq').mockResolvedValueOnce({ data: null, error: new Error('DB Error') });
      const result = await service.getInventory('2');
      expect(result.length).toBe(0);
    });
  });
});
