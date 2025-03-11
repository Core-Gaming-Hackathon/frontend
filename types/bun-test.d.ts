declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): {
    toBe(expected: T): void;
    toEqual(expected: any): void;
    toBeNull(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeInstanceOf(cls: any): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    toBeLessThan(n: number): void;
    toBeLessThanOrEqual(n: number): void;
    toContain(item: any): void;
    toHaveLength(length: number): void;
    toHaveProperty(key: string, value?: any): void;
    toMatch(pattern: RegExp | string): void;
    toMatchObject(object: object): void;
    toStrictEqual(expected: any): void;
    toThrow(error?: string | RegExp | Error | ErrorConstructor): void;
    not: any;
    resolves: any;
    rejects: any;
  };
  export function mock<T extends (...args: any[]) => any>(
    implementation?: T
  ): jest.Mock<ReturnType<T>, Parameters<T>>;
  
  export interface MockedFunction<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mock: {
      calls: Array<Parameters<T>>;
      results: Array<{type: 'return' | 'throw', value: any}>;
      instances: Array<any>;
      invocationCallOrder: Array<number>;
      lastCall?: Parameters<T>;
    };
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
    mockImplementation(fn: T): this;
    mockImplementationOnce(fn: T): this;
    mockReturnValue(value: ReturnType<T>): this;
    mockReturnValueOnce(value: ReturnType<T>): this;
    mockResolvedValue(value: Awaited<ReturnType<T>>): this;
    mockResolvedValueOnce(value: Awaited<ReturnType<T>>): this;
    mockRejectedValue(value: any): this;
    mockRejectedValueOnce(value: any): this;
  }
}
