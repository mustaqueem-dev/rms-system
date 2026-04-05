// apps/inventory-service/src/inventory/application/use-cases/__tests__/adjust-stock.use-case.spec.ts
//
// AdjustStockUseCase signature: execute(id: string, dto: AdjustStockDto, tenant: TenantContext)

import { AdjustStockUseCase } from '../adjust-stock.use-case';
import { NotFoundError, BusinessRuleViolationError } from '@rms/shared-kernel';
import type { TenantContext } from '@rms/shared-kernel';

const tenant: TenantContext = {
  userId:      'mgr-1',
  franchiseId: 'franchise-1',
  branchId:    'branch-1',
  role:        'BRANCH_MANAGER' as never,
};

const makeItem = (qty: number) => ({
  id:          'item-1',
  branchId:    'branch-1',
  franchiseId: 'franchise-1',
  name:        'Tomatoes',
  stock:       { quantity: qty, unit: 'kg' },
  reorderRule: { reorderLevel: 10 },
  adjustStock: jest.fn().mockImplementation((delta: number) => {
    const next = qty + delta;
    if (next < 0) return { isFailure: true, error: 'Stock cannot go negative' };
    qty = next;
    return { isSuccess: true };
  }),
  domainEvents:       [],
  clearDomainEvents:  jest.fn(),
});

const mockRepo = (item: ReturnType<typeof makeItem> | null) => ({
  findById: jest.fn().mockResolvedValue(item),
  update:   jest.fn().mockResolvedValue(undefined),
});

describe('AdjustStockUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws NotFoundError when item does not exist', async () => {
    const uc = new AdjustStockUseCase(mockRepo(null) as never, { publishAll: jest.fn() } as never);
    await expect(uc.execute('item-1', { delta: 5, reason: 'inbound' }, tenant))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws BusinessRuleViolationError when adjustment makes stock negative', async () => {
    const item = makeItem(5);
    const uc   = new AdjustStockUseCase(mockRepo(item) as never, { publishAll: jest.fn() } as never);
    await expect(uc.execute('item-1', { delta: -10, reason: 'deduct' }, tenant))
      .rejects.toBeInstanceOf(BusinessRuleViolationError);
  });

  it('adjusts stock correctly and saves item', async () => {
    const item = makeItem(20);
    const repo = mockRepo(item);
    const uc   = new AdjustStockUseCase(repo as never, { publishAll: jest.fn() } as never);

    await uc.execute('item-1', { delta: 5, reason: 'stock-in' }, tenant);

    expect(item.adjustStock).toHaveBeenCalledWith(5, tenant.userId);
    expect(repo.update).toHaveBeenCalledWith(item);
  });
});
