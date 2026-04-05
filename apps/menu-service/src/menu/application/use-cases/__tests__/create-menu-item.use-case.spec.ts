// apps/menu-service/src/menu/application/use-cases/__tests__/create-menu-item.use-case.spec.ts

import { CreateMenuItemUseCase } from '../create-menu-item.use-case';
import { ValidationError, ConflictError } from '@rms/shared-kernel';
import type { TenantContext } from '@rms/shared-kernel';

const tenant: TenantContext = {
  userId:      'mgr-1',
  franchiseId: 'franchise-1',
  branchId:    'branch-1',
  role:        'BRANCH_MANAGER' as never,
};

const mockRepo = () => ({
  existsByNameAndBranch: jest.fn().mockResolvedValue(false),
  save:                  jest.fn().mockResolvedValue(undefined),
});

const mockPublisher = () => ({ publishAll: jest.fn() });

function makeUseCase(repo = mockRepo(), pub = mockPublisher()) {
  return new CreateMenuItemUseCase(repo as never, pub as never);
}

const validDto = {
  name:        'Paneer Tikka',
  description: 'Classic North Indian starter',
  price:       250,
  category:    'Starters',
  isVeg:       true,
  tags:        [] as string[],
};

describe('CreateMenuItemUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ValidationError for negative price', async () => {
    const uc = makeUseCase();
    await expect(uc.execute({ ...validDto, price: -1 }, tenant))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it('throws ConflictError when name already exists in branch', async () => {
    const repo = mockRepo();
    repo.existsByNameAndBranch.mockResolvedValue(true);
    const uc = makeUseCase(repo);
    await expect(uc.execute(validDto, tenant)).rejects.toBeInstanceOf(ConflictError);
  });

  it('saves new menu item and publishes event on success', async () => {
    const repo = mockRepo();
    const pub  = mockPublisher();
    const uc   = makeUseCase(repo, pub);

    await uc.execute(validDto, tenant);

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(pub.publishAll).toHaveBeenCalled();
  });
});
