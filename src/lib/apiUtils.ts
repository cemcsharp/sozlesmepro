import { NextRequest, NextResponse } from 'next/server'
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  DatabaseError, 
  ExternalServiceError,
  handleApiError,
  handleDatabaseError,
  handleExternalServiceError,
  handleNetworkError,
  handleFileUploadError,
  logError
} from '@/lib/errors'

// API Response wrapper
export class ApiResponse {
  static success(data: any, message?: string, status: number = 200) {
    return NextResponse.json({
      success: true,
      data,
      message: message || 'Success'
    }, { status })
  }

  static error(error: AppError | Error, status?: number) {
    const errorResponse = handleApiError(error)
    return NextResponse.json(errorResponse, { 
      status: status || errorResponse.statusCode 
    })
  }

  static validationError(errors: Array<{ field: string; message: string }>) {
    return NextResponse.json({
      success: false,
      error: 'ValidationError',
      message: 'Validation failed',
      errors
    }, { status: 400 })
  }

  static notFound(message: string = 'Resource not found') {
    return this.error(new NotFoundError(message), 404)
  }

  static unauthorized(message: string = 'Unauthorized') {
    return this.error(new UnauthorizedError(message), 401)
  }

  static forbidden(message: string = 'Forbidden') {
    return this.error(new ForbiddenError(message), 403)
  }

  static conflict(message: string = 'Conflict') {
    return this.error(new ConflictError(message), 409)
  }

  static internalError(message: string = 'Internal server error') {
    return this.error(new AppError(message), 500)
  }
}

// Request validation helper
export const validateRequest = (schema: any, data: any) => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in (error as any)) {
      const errors = (error as any).issues.map((err: any) => ({
        field: Array.isArray(err.path) ? err.path.join('.') : String(err.path ?? ''),
        message: err.message
      }))
      return { success: false, errors }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation failed' }] }
  }
}

// Async handler wrapper for API routes
export const withErrorHandler = (handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args)
    } catch (error) {
      logError(error, { 
        url: req.url, 
        method: req.method,
        headers: Object.fromEntries(req.headers.entries())
      })

      if (error instanceof AppError) {
        return ApiResponse.error(error)
      }

      if (error instanceof Error) {
        // Handle specific error types
        if (error.name === 'PrismaClientKnownRequestError') {
          return ApiResponse.error(handleDatabaseError(error))
        }

        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
          return ApiResponse.error(handleNetworkError(error))
        }

        if (error.message.includes('File upload')) {
          return ApiResponse.error(handleFileUploadError(error))
        }
      }

      // Unknown error
      return ApiResponse.internalError('An unexpected error occurred')
    }
  }
}

// Request body parser with error handling
export const parseRequestBody = async (req: NextRequest) => {
  try {
    const contentType = req.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Content-Type must be application/json', 'contentType')
    }

    const body = await req.json()
    return body
  } catch (error) {
    if (error instanceof Error && error.message.includes('JSON.parse')) {
      throw new ValidationError('Invalid JSON format', 'body')
    }
    throw error
  }
}

// Query parameter parser with validation
export const parseQueryParams = (req: NextRequest, schema?: any) => {
  try {
    const { searchParams } = new URL(req.url)
    const params: Record<string, string> = {}
    
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    if (schema) {
      const result = validateRequest(schema, params)
      if (!result.success) {
        throw new ValidationError('Invalid query parameters', 'query')
      }
      return result.data
    }

    return params
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    throw new ValidationError('Invalid query parameters', 'query')
  }
}

// Rate limiting helper (in-memory for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export const checkRateLimit = (
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 60000 // 1 minute
): boolean => {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// CORS helper
export const setCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

// Security headers helper
export const setSecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

// Request logging helper
export const logRequest = (req: NextRequest) => {
  const logData = {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    timestamp: new Date().toISOString()
  }
  
  console.log('API Request:', JSON.stringify(logData, null, 2))
}

// Response time tracker
export const trackResponseTime = (handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) => {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now()
    
    try {
      const response = await handler(req, ...args)
      const responseTime = Date.now() - startTime
      
      response.headers.set('X-Response-Time', responseTime.toString())
      
      if (responseTime > 1000) {
        console.warn(`Slow API request: ${req.method} ${req.url} took ${responseTime}ms`)
      }
      
      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error(`API request failed after ${responseTime}ms:`, error)
      throw error
    }
  }
}

// Compose multiple middleware
export const compose = (...middlewares: any[]) => {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}

// Common middleware composition
export const withCommonMiddleware = (handler: any) => {
  return compose(
    trackResponseTime,
    withErrorHandler
  )(handler)
}