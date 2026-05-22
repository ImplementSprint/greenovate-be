import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { SupabaseService } from '../supabase.service';
import { UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let mockClient: any;

  beforeEach(async () => {
    mockClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
        updateUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    const mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => expect(controller).toBeDefined());

  describe('login', () => {
    it('should return session and user on success', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: { token: 'abc' }, user: { id: '1' } },
        error: null,
      });
      const result = await controller.login({ email: 'a@b.com', password: 'pass' });
      expect(result.session).toEqual({ token: 'abc' });
      expect(result.user).toEqual({ id: '1' });
    });

    it('should throw UnauthorizedException on error', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login' } });
      await expect(controller.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should return success on logout', async () => {
      mockClient.auth.signOut.mockResolvedValue({ error: null });
      const result = await controller.logout();
      expect(result.success).toBe(true);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockClient.auth.signOut.mockResolvedValue({ error: { message: 'Sign out failed' } });
      await expect(controller.logout()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getSession', () => {
    it('should return session', async () => {
      mockClient.auth.getSession.mockResolvedValue({ data: { session: { token: 'abc' } }, error: null });
      const result = await controller.getSession();
      expect(result.session).toEqual({ token: 'abc' });
    });

    it('should throw UnauthorizedException on error', async () => {
      mockClient.auth.getSession.mockResolvedValue({ data: {}, error: { message: 'Session error' } });
      await expect(controller.getSession()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should throw BadRequestException for invalid userId', async () => {
      await expect(controller.getProfile('not-a-uuid')).rejects.toThrow(BadRequestException);
    });

    it('should return profile data for valid userId', async () => {
      mockClient.single.mockResolvedValue({ data: { id: '00000000-0000-0000-0000-000000000001', email: 'a@b.com' }, error: null });
      const result = await controller.getProfile('00000000-0000-0000-0000-000000000001');
      expect(result.profile).toBeDefined();
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockClient.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
      await expect(controller.getProfile('00000000-0000-0000-0000-000000000001')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should return success on password change', async () => {
      mockClient.auth.updateUser.mockResolvedValue({ error: null });
      const result = await controller.changePassword({ newPassword: 'newpass123' });
      expect(result.success).toBe(true);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockClient.auth.updateUser.mockResolvedValue({ error: { message: 'Update failed' } });
      await expect(controller.changePassword({ newPassword: 'newpass' })).rejects.toThrow(InternalServerErrorException);
    });
  });
});
