'use strict';

// ── Mock the repos — no real DB ───────────────────────────────────────────
jest.mock('../../src/db/repositories/user.repo');
jest.mock('../../src/db/repositories/account.repo');
jest.mock('../../src/services/audit.logger');

const userRepo    = require('../../src/db/repositories/user.repo');
const accountRepo = require('../../src/db/repositories/account.repo');
const authService = require('../../src/services/auth.service');
const bcrypt      = require('bcryptjs');

const MOCK_USER = {
  _id:      'user123',
  id:       'user123',
  firstName:'Rahul',
  lastName: 'Sharma',
  email:    'rahul@test.com',
  phone:    '9876543210',
  role:     'borrower',
  isActive: true,
  password: bcrypt.hashSync('Password1', 10),
};

beforeEach(() => jest.clearAllMocks());

describe('authService.register', () => {
  it('creates a user and returns tokens', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.existsByPhone.mockResolvedValue(false);
    userRepo.create.mockResolvedValue(MOCK_USER);
    accountRepo.create.mockResolvedValue({});

    const result = await authService.register({
      firstName: 'Rahul',
      lastName:  'Sharma',
      email:     'rahul@test.com',
      phone:     '9876543210',
      password:  'Password1',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('rahul@test.com');
    expect(userRepo.create).toHaveBeenCalledTimes(1);
    expect(accountRepo.create).toHaveBeenCalledTimes(1);
  });

  it('throws 409 when email already exists', async () => {
    userRepo.existsByEmail.mockResolvedValue(true);

    await expect(
      authService.register({ email: 'rahul@test.com', phone: '9876543210', password: 'Password1' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('throws 409 when phone already exists', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.existsByPhone.mockResolvedValue(true);

    await expect(
      authService.register({ email: 'new@test.com', phone: '9876543210', password: 'Password1' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('authService.login', () => {
  it('returns tokens for valid credentials', async () => {
    userRepo.findByPhone.mockResolvedValue(MOCK_USER);
    userRepo.updateById.mockResolvedValue(MOCK_USER);

    const result = await authService.login({ identifier: '9876543210', password: 'Password1' });

    expect(result).toHaveProperty('accessToken');
    expect(result.user.email).toBe('rahul@test.com');
  });

  it('throws 401 for unknown identifier', async () => {
    userRepo.findByPhone.mockResolvedValue(null);

    await expect(
      authService.login({ identifier: '9000000000', password: 'Password1' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 401 for wrong password', async () => {
    userRepo.findByPhone.mockResolvedValue(MOCK_USER);

    await expect(
      authService.login({ identifier: '9876543210', password: 'WrongPass1' })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 403 for deactivated account', async () => {
    userRepo.findByPhone.mockResolvedValue({ ...MOCK_USER, isActive: false });

    await expect(
      authService.login({ identifier: '9876543210', password: 'Password1' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('authService.verifyAccess', () => {
  it('verifies a freshly issued access token', async () => {
    userRepo.existsByEmail.mockResolvedValue(false);
    userRepo.existsByPhone.mockResolvedValue(false);
    userRepo.create.mockResolvedValue(MOCK_USER);
    accountRepo.create.mockResolvedValue({});

    const { accessToken } = await authService.register({
      firstName: 'Test', lastName: 'User',
      email: 't@t.com', phone: '9000000001', password: 'Password1',
    });

    const payload = authService.verifyAccess(accessToken);
    expect(payload).toHaveProperty('sub', 'user123');
    expect(payload).toHaveProperty('role', 'borrower');
  });

  it('throws for a tampered token', () => {
    expect(() => authService.verifyAccess('bad.token.here')).toThrow();
  });
});
