// apps/auth-service/src/auth/application/use-cases/__tests__/login.use-case.spec.ts

import { LoginUseCase }     from '../login.use-case';
import { ValidationError, UnauthorizedError } from '@rms/shared-kernel';

// ── helpers ───────────────────────────────────────────────────────────────────

const mockJwt = { signAsync: jest.fn().mockResolvedValue('mock.jwt.token') };

const fakeUser = {
  id:           'user-1',
  email:        'chef@rms.local',
  name:         'Chef A',
  role:         'KITCHEN_STAFF',
  franchiseId:  'franchise-1',
  branchId:     'branch-1',
  isActive:     true,
  passwordHash: '$2b$10$fakeHashedValue00000000000000000000000000000', // won't be compared directly
};

function mockRepo(overrides: Partial<typeof fakeUser> | null = fakeUser) {
  return { findByEmail: jest.fn().mockResolvedValue(overrides) };
}

function makeUseCase(repo: unknown) {
  return new LoginUseCase(
    repo as never,
    { publishAll: jest.fn() } as never,
    mockJwt as never,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('LoginUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ValidationError for invalid email format', async () => {
    const uc = makeUseCase(mockRepo());
    await expect(uc.execute({ email: 'not-an-email', password: 'pass' }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws UnauthorizedError when user not found', async () => {
    const uc = makeUseCase(mockRepo(null));
    await expect(uc.execute({ email: 'nobody@rms.local', password: 'pass' }))
      .rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError when account is deactivated', async () => {
    const uc = makeUseCase(mockRepo({ ...fakeUser, isActive: false }));
    await expect(uc.execute({ email: 'chef@rms.local', password: 'secret' }))
      .rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('throws UnauthorizedError for wrong password', async () => {
    // HashedPassword.fromHash returns a VO whose compare() always returns false for a fake hash
    const uc = makeUseCase(mockRepo());
    await expect(uc.execute({ email: 'chef@rms.local', password: 'WRONG' }))
      .rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('returns AuthResponseDto with accessToken on valid credentials', async () => {
    // Use bcrypt hash for 'correct' so compare() returns true
    const bcrypt = await import('bcrypt');
    const hash   = await bcrypt.hash('correct', 10);
    const repo   = mockRepo({ ...fakeUser, passwordHash: hash });
    const uc     = makeUseCase(repo);

    const result = await uc.execute({ email: 'chef@rms.local', password: 'correct' });

    expect(result.accessToken).toBe('mock.jwt.token');
    expect(result.user.email).toBe('chef@rms.local');
    expect(mockJwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'user-1', role: 'KITCHEN_STAFF' }),
    );
  });
});
