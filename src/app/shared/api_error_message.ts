import { HttpErrorResponse } from '@angular/common/http';

type ErrorEnvelope = {
  message?: string;
  error?: {
    user_message?: string;
    detail?: string;
    message?: string;
  };
};

export interface UserErrorMessageOptions {
  action?: string;
  defaultMessage?: string;
  unauthorizedMessage?: string;
  forbiddenMessage?: string;
  notFoundMessage?: string;
  conflictMessage?: string;
  validationMessage?: string;
  networkMessage?: string;
  serverMessage?: string;
}

function backendMessage(error: HttpErrorResponse): string | null {
  const envelope = error.error as ErrorEnvelope | string | null | undefined;
  if (typeof envelope === 'string' && envelope.trim()) {
    return envelope.trim();
  }
  if (!envelope || typeof envelope !== 'object') {
    return null;
  }
  const msg =
    envelope?.error?.user_message ??
    envelope?.error?.detail ??
    envelope?.error?.message ??
    envelope?.message;
  return typeof msg === 'string' && msg.trim() ? msg.trim() : null;
}

export function toUserErrorMessage(
  error: HttpErrorResponse,
  options: UserErrorMessageOptions = {},
): string {
  const explicit = backendMessage(error);
  if (explicit) {
    return explicit;
  }

  const action = options.action?.trim() || 'complete this request';
  const fallback =
    options.defaultMessage ?? `Unable to ${action} right now. Please try again.`;

  switch (error.status) {
    case 0:
      return (
        options.networkMessage ??
        'Unable to reach server. Check your internet connection and try again.'
      );
    case 400:
    case 422:
      return (
        options.validationMessage ??
        `Some input is invalid. Please review and retry ${action}.`
      );
    case 401:
      return (
        options.unauthorizedMessage ??
        'Your session expired. Please login again and retry.'
      );
    case 403:
      return (
        options.forbiddenMessage ??
        'You are not allowed to perform this action.'
      );
    case 404:
      return (
        options.notFoundMessage ??
        'Requested record was not found.'
      );
    case 409:
      return (
        options.conflictMessage ??
        'This action conflicts with existing data. Please refresh and retry.'
      );
    case 413:
      return 'Selected file is too large. Please upload a smaller image.';
    case 415:
      return 'Unsupported file type. Please upload a valid image format.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      if (error.status >= 500) {
        return (
          options.serverMessage ??
          'Server error occurred. Please try again in a moment.'
        );
      }
      return fallback;
  }
}
