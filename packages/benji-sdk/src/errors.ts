export class BenjiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BenjiError';
  }
}

export class BenjiConfigError extends BenjiError {
  constructor(message: string) {
    super(message);
    this.name = 'BenjiConfigError';
  }
}

export class BenjiApiError extends BenjiError {
  public readonly status: number;
  public readonly code: string;
  public readonly issues?: Array<{ message: string }>;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    issues?: Array<{ message: string }>;
  }) {
    super(options.message);
    this.name = 'BenjiApiError';
    this.status = options.status;
    this.code = options.code;
    this.issues = options.issues;
  }
}
