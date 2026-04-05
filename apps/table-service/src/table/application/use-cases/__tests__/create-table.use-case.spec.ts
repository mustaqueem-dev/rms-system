// apps/table-service/src/table/application/use-cases/__tests__/create-table.use-case.spec.ts

import { CreateTableUseCase } from '../create-table.use-case';
import type { TenantContext } from '@rms/shared-kernel';

const tenant: TenantContext = {
  userId:      'mgr-1',
  franchiseId: 'franchise-1',
  branchId:    'branch-1',
  role:        'BRANCH_MANAGER' as never,
};

const mockRepo      = () => ({
  findByNumber: jest.fn().mockResolvedValue(null),
  save:         jest.fn().mockResolvedValue(undefined),
});
const mockPublisher = () => ({ publishAll: jest.fn() });

function makeUseCase(repo = mockRepo(), pub = mockPublisher()) {
  return new CreateTableUseCase(repo as never, pub as never);
}

const validDto = { tableNumber: 5, capacity: 4, section: 'Main Hall' };

describe('CreateTableUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws for capacity <= 0', async () => {
    const uc = makeUseCase();
    await expect(uc.execute({ ...validDto, capacity: 0 }, tenant)).rejects.toBeDefined();
  });

  it('throws for tableNumber <= 0', async () => {
    const uc = makeUseCase();
    await expect(uc.execute({ ...validDto, tableNumber: -1 }, tenant)).rejects.toBeDefined();
  });

  it('saves table and publishes event on success', async () => {
    const repo = mockRepo();
    const pub  = mockPublisher();
    const uc   = makeUseCase(repo, pub);

    await uc.execute(validDto, tenant);

    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(pub.publishAll).toHaveBeenCalled();
  });
});
