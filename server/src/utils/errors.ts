/**
 * Typed application error hierarchy.
 *
 * All domain modules (property, venue, booking, …) throw these instead of plain
 * Error objects so controllers can map them to HTTP status codes without
 * inspecting error messages.
 *
 * Usage in a controller:
 *   catch (e) {
 *     if (e instanceof NotFoundError) return ResponseUtil.notFound(res, e.message);
 *     if (e instanceof ForbiddenError) return ResponseUtil.forbidden(res, e.message);
 *     …
 *   }
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Restore prototype chain in compiled TS
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 404 — resource not found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** 403 — authenticated but not authorised (ownership failure) */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/** 409 — uniqueness violation */
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/** 422 — input passed schema validation but violates a business rule */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

/**
 * 422 — illegal state-machine transition.
 *
 * Thrown by property.workflow.ts when a requested status change is not allowed
 * from the property's current status.
 */
export class WorkflowError extends AppError {
  public readonly currentStatus: string;
  public readonly attemptedTransition: string;

  constructor(currentStatus: string, attemptedTransition: string) {
    super(
      `Cannot perform '${attemptedTransition}': current status is '${currentStatus}'`,
      422,
      'WORKFLOW_ERROR'
    );
    this.currentStatus = currentStatus;
    this.attemptedTransition = attemptedTransition;
  }
}
