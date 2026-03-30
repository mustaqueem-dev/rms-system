// apps/menu-service/src/menu/domain/value-objects/price.vo.ts

import { ValueObject, Result, Guard } from '@rms/shared-kernel';
import { InvalidPriceError }          from '@rms/shared-kernel';

interface PriceProps {
  amount:   number;   // stored in lowest denomination (e.g. paise if INR)
  currency: string;   // ISO 4217, e.g. 'INR', 'USD'
  taxRate:  number;   // e.g. 0.18 for 18% GST
}

export class Price extends ValueObject<PriceProps> {
  get amount():   number { return this.props.amount; }
  get currency(): string { return this.props.currency; }
  get taxRate():  number { return this.props.taxRate; }

  /** Amount including tax, rounded to 2 decimal places */
  get amountWithTax(): number {
    return Math.round(this.props.amount * (1 + this.props.taxRate) * 100) / 100;
  }

  private constructor(props: PriceProps) {
    super(props);
  }

  static create(
    amount:   number,
    currency: string,
    taxRate = 0
  ): Result<Price, string> {
    if (amount < 0) return Result.fail(new InvalidPriceError(amount).message);

    const currencyCheck = Guard.againstEmptyString(currency, 'currency');
    if (currencyCheck.isFailure) return Result.fail(currencyCheck.error);

    if (taxRate < 0 || taxRate > 1) {
      return Result.fail(`taxRate must be between 0 and 1, got: ${taxRate}`);
    }

    return Result.ok(new Price({ amount, currency: currency.toUpperCase(), taxRate }));
  }

  add(other: Price): Result<Price, string> {
    if (this.currency !== other.currency) {
      return Result.fail(`Cannot add prices in different currencies: ${this.currency} vs ${other.currency}`);
    }
    return Price.create(this.amount + other.amount, this.currency, this.taxRate);
  }

  multiply(factor: number): Result<Price, string> {
    if (factor < 0) return Result.fail('Factor must be non-negative');
    return Price.create(Math.round(this.amount * factor), this.currency, this.taxRate);
  }
}
