// apps/order-service/src/order/application/use-cases/__tests__/create-order.use-case.spec.ts

import { CreateOrderUseCase } from '../create-order.use-case';
import { BusinessRuleViolationError } from '@rms/shared-kernel';
import type { TenantContext } from '@rms/shared-kernel';

const tenant: TenantContext = {
  userId:      'waiter-1',
  franchiseId: 'franchise-1',
  branchId:    'branch-1',
  role:        'WAITER' as never,
};

const mockRepo      = () => ({ save: jest.fn().mockResolvedValue(undefined) });
const mockPublisher = () => ({ publishAll: jest.fn() });

function makeUseCase() {
  return new CreateOrderUseCase(mockRepo() as never, mockPublisher() as never);
}

const validDto = {
  tableNumber: 5,
  lines: [
    { menuItemId: 'item-1', name: 'Paneer Tikka', unitPrice: 250, quantity: 2 },
    { menuItemId: 'item-2', name: 'Naan',         unitPrice: 40,  quantity: 3 },
  ],
};

describe('CreateOrderUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws error when lines array is empty', async () => {
    const uc = makeUseCase();
    await expect(uc.execute({ ...validDto, lines: [] }, tenant))
      .rejects.toBeDefined();
  });

  it('throws error for zero/negative quantity in a line', async () => {
    const uc = makeUseCase();
    await expect(uc.execute({
      ...validDto,
      lines: [{ ...validDto.lines[0], quantity: 0 }],
    }, tenant)).rejects.toBeDefined();
  });

  it('saves the order on valid input', async () => {
    const repo = mockRepo();
    const uc   = new CreateOrderUseCase(repo as never, mockPublisher() as never);
    await uc.execute(validDto, tenant);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('publishes event after successful order creation', async () => {
    const pub = mockPublisher();
    const uc  = new CreateOrderUseCase(mockRepo() as never, pub as never);
    await uc.execute(validDto, tenant);
    expect(pub.publishAll).toHaveBeenCalled();
  });
});
