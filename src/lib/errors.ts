// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, 400, true)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, true)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true)
    this.name = 'ConflictError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, true)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 502, true)
    this.name = 'ExternalServiceError'
  }
}

// Error type guard
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

// Error handler utilities
export const handleApiError = (error: unknown) => {
  console.error('API Error:', error)

  if (isAppError(error)) {
    return {
      success: false,
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: 'InternalServerError',
      message: error.message,
      statusCode: 500,
      isOperational: false
    }
  }

  return {
    success: false,
    error: 'UnknownError',
    message: 'An unknown error occurred',
    statusCode: 500,
    isOperational: false
  }
}

// Async error wrapper
export const asyncHandler = <T extends any[], U>(
  fn: (...args: T) => Promise<U>
) => {
  return async (...args: T): Promise<U> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (isAppError(error)) {
        throw error
      }
      
      // Convert unknown errors to AppError
      if (error instanceof Error) {
        throw new AppError(error.message)
      }
      
      throw new AppError('An unknown error occurred')
    }
  }
}

// Validation error helper
export const createValidationError = (field: string, message: string): ValidationError => {
  return new ValidationError(message, field)
}

// Database error helper
export const handleDatabaseError = (error: unknown): never => {
  console.error('Database Error:', error)
  
  if (error instanceof Error) {
    // Prisma specific errors
    if (error.name === 'PrismaClientKnownRequestError') {
      if (error.message.includes('Unique constraint')) {
        throw new ConflictError('Record already exists')
      }
      if (error.message.includes('Foreign key constraint')) {
        throw new ValidationError('Invalid reference', 'foreignKey')
      }
    }
    
    throw new DatabaseError(error.message)
  }
  
  throw new DatabaseError('Unknown database error')
}

// External service error helper
export const handleExternalServiceError = (service: string, error: unknown): never => {
  console.error(`${service} Service Error:`, error)
  
  if (error instanceof Error) {
    throw new ExternalServiceError(service, error.message)
  }
  
  throw new ExternalServiceError(service, 'Unknown service error')
}

// Error logging utility
export const logError = (error: unknown, context?: any) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context
  }
  
  console.error('Error Log:', JSON.stringify(errorData, null, 2))
  
  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
}

// Client-side error handler
export const handleClientError = (error: unknown, fallbackMessage: string = 'Bir hata oluştu') => {
  logError(error)
  
  if (isAppError(error)) {
    return {
      title: 'Hata',
      description: error.message,
      variant: 'destructive' as const
    }
  }
  
  if (error instanceof Error) {
    return {
      title: 'Hata',
      description: error.message,
      variant: 'destructive' as const
    }
  }
  
  return {
    title: 'Hata',
    description: fallbackMessage,
    variant: 'destructive' as const
  }
}

// Network error handler
export const handleNetworkError = (error: unknown): never => {
  if (error instanceof Error) {
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      throw new AppError('Network connection error. Please check your internet connection.', 503)
    }
  }
  
  throw new AppError('Network error occurred', 503)
}

// File upload error handler
export const handleFileUploadError = (error: unknown): never => {
  if (error instanceof Error) {
    if (error.message.includes('File too large')) {
      throw new ValidationError('File size exceeds maximum limit', 'fileSize')
    }
    if (error.message.includes('Invalid file type')) {
      throw new ValidationError('Invalid file type', 'fileType')
    }
  }
  
  throw new ValidationError('File upload failed', 'fileUpload')
}