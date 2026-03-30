// packages/shared-kernel/src/core/value-object.ts

export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  // Value objects are equal if their properties are equal
  equals(other?: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    if (other.props === undefined) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}