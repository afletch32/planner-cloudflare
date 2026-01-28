export class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.code = code;
  }
}

export class PermissionError extends Error {
  constructor(message, code = 'PERMISSION_DENIED') {
    super(message);
    this.code = code;
  }
}
