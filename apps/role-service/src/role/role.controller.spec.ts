import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { SupabaseService } from '../supabase.service';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('RoleController', () => {
  let controller: RoleController;
  let mockClient: any;

  const buildChain = (resolvedValue: any) => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
    auth: { resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }) },
  });

  beforeEach(async () => {
    mockClient = {
      from: jest.fn(),
      auth: { resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }) },
    };

    const mockSupabaseService = { getClient: jest.fn().mockReturnValue(mockClient) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [{ provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile();

    controller = module.get<RoleController>(RoleController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  describe('getUsers', () => {
    it('should return user list', async () => {
      mockClient.from.mockReturnValue({ select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }) });
      const result = await controller.getUsers();
      expect(result.users).toHaveLength(1);
    });

    it('should return empty array when no users', async () => {
      mockClient.from.mockReturnValue({ select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: null }) });
      const result = await controller.getUsers();
      expect(result.users).toEqual([]);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockClient.from.mockReturnValue({ select: jest.fn().mockReturnThis(), order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }) });
      await expect(controller.getUsers()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUser', () => {
    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.getUser('not-valid')).rejects.toThrow(BadRequestException);
    });

    it('should return user for valid id', async () => {
      mockClient.from.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000001' }, error: null }) });
      const result = await controller.getUser('00000000-0000-0000-0000-000000000001');
      expect(result.user).toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      mockClient.from.mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }) });
      await expect(controller.getUser('00000000-0000-0000-0000-000000000001')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleActive', () => {
    it('should throw BadRequestException for invalid id', async () => {
      await expect(controller.toggleActive('bad-id', { is_active: true })).rejects.toThrow(BadRequestException);
    });

    it('should return updated user on success', async () => {
      mockClient.from.mockReturnValue({ update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000001', is_active: false }, error: null }) });
      const result = await controller.toggleActive('00000000-0000-0000-0000-000000000001', { is_active: false });
      expect(result.user).toBeDefined();
    });

    it('should throw InternalServerErrorException on db error', async () => {
      mockClient.from.mockReturnValue({ update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }) });
      await expect(controller.toggleActive('00000000-0000-0000-0000-000000000001', { is_active: false })).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('resetPassword', () => {
    it('should return success', async () => {
      const result = await controller.resetPassword({ email: 'a@b.com' });
      expect(result.success).toBe(true);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { message: 'Reset error' } });
      await expect(controller.resetPassword({ email: 'a@b.com' })).rejects.toThrow(InternalServerErrorException);
    });
  });
});
