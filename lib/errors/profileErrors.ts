export class ProfileError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'PROFILE_ERROR') {
    super(message);
    this.name = 'ProfileError';
    this.code = code;
  }
}

export class NotFoundError extends ProfileError {
  constructor(message = 'Profile not found') {
    super(message, 'NOT_FOUND');
  }
}

export class DuplicateUsernameError extends ProfileError {
  constructor(message = 'Username already taken') {
    super(message, 'DUPLICATE_USERNAME');
  }
}

export class UnauthorizedError extends ProfileError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED');
  }
}
