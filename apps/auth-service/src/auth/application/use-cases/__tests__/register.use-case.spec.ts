// apps/auth-service/src/auth/application/use-cases/__tests__/register.use-case.spec.ts

import { RegisterUseCase }  from '../register.use-case';
import { UserRole }         from '@rms/shared-kernel';
import { ValidationError, ConflictError } from '@rms/shared-kernel';

const mockJwt = { signAsync: jest.fn().mockResolvedValue('mock.jwt.token') };

function mockRepo(existsByEmail = false) {
  return {
    existsByEmail: jest.fn().mockResolvedValue(existsByEmail),
    save:          jest.fn().mockResolvedValue(undefined),
  };
}

function makeUseCase(repo: unknown) {
  return new RegisterUseCase(
    repo as never,
    { publishAll: jest.fn() } as never,
    mockJwt as never,
  );
}

const validDto = {
  email:       'newchef@rms.local',
  password:    'StrongPass1!',
  name:        'New Chef',
  role:        UserRole.STAFF,
  franchiseId: 'franchise-1',
  branchId:    'branch-1',
};

describe('RegisterUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ValidationError for invalid email', async () => {
    const uc = makeUseCase(mockRepo());
    await expect(uc.execute({ ...validDto, email: 'bad' }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ConflictError when email already registered', async () => {
    const uc = makeUseCase(mockRepo(true));
    await expect(uc.execute(validDto))
      .rejects.toBeInstanceOf(ConflictError);
  });

  it('creates user and returns accessToken on valid registration', async () => {
    const repo = mockRepo(false);
    const uc   = makeUseCase(repo);

    const result = await uc.execute(validDto);

    expect(result.accessToken).toBe('mock.jwt.token');
    expect(result.user.email).toBe('newchef@rms.local');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('calls eventPublisher.publish with UserRegisteredEvent', async () => {
    const publisher = { publishAll: jest.fn() };
    const repo      = mockRepo(false);
    const uc        = new RegisterUseCase(repo as never, publisher as never, mockJwt as never);

    await uc.execute(validDto);
    expect(publisher.publishAll).toHaveBeenCalled();
  });
});
