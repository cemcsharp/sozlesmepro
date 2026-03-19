'use client'

import { useState, useCallback } from 'react'
import { ValidationResult, ValidationError } from '@/lib/validation'

interface UseFormOptions<T> {
  initialValues: T
  onSubmit: (values: T) => Promise<void> | void
  validate?: (values: T) => ValidationResult<T>
}

interface UseFormReturn<T> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isLoading: boolean
  handleChange: (field: keyof T, value: any) => void
  handleBlur: (field: keyof T) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
  resetForm: () => void
  setValues: (values: T) => void
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }, [errors])

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field on blur if validation function is provided
    if (validate) {
      const result = validate(values)
      if (!result.success && result.errors) {
        const fieldErrors = result.errors.filter(error => error.field === field)
        if (fieldErrors.length > 0) {
          setErrors(prev => ({ ...prev, [field]: fieldErrors[0].message }))
        }
      }
    }
  }, [validate, values])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(allTouched)

    // Validate form
    let validationErrors: ValidationError[] = []
    if (validate) {
      const result = validate(values)
      if (!result.success && result.errors) {
        validationErrors = result.errors
      }
    }

    // Convert validation errors to field errors
    const fieldErrors: Record<string, string> = {}
    validationErrors.forEach(error => {
      fieldErrors[error.field] = error.message
    })
    setErrors(fieldErrors)

    // If there are errors, don't submit
    if (Object.keys(fieldErrors).length > 0) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(values)
    } catch (error) {
      console.error('Form submission error:', error)
      // You could handle global errors here
    } finally {
      setIsLoading(false)
    }
  }, [values, validate, onSubmit])

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isLoading,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    setValues
  }
}

// Hook for async form submission with better error handling
interface UseAsyncFormOptions<T> extends UseFormOptions<T> {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useAsyncForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  onSuccess,
  onError
}: UseAsyncFormOptions<T>): UseFormReturn<T> & {
  error: Error | null
  isSuccess: boolean
} {
  const [error, setError] = useState<Error | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allTouched = Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    
    // Validate form
    let validationErrors: ValidationError[] = []
    if (validate) {
      const result = validate(initialValues)
      if (!result.success && result.errors) {
        validationErrors = result.errors
      }
    }

    // Convert validation errors to field errors
    const fieldErrors: Record<string, string> = {}
    validationErrors.forEach(error => {
      fieldErrors[error.field] = error.message
    })

    if (Object.keys(fieldErrors).length > 0) {
      return
    }

    try {
      await onSubmit(initialValues)
      setIsSuccess(true)
      setError(null)
      onSuccess?.(undefined)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      setIsSuccess(false)
      onError?.(error)
    }
  }, [initialValues, validate, onSubmit, onSuccess, onError])

  return {
    values: initialValues,
    errors: {},
    touched: {},
    isLoading: false,
    handleChange: () => {},
    handleBlur: () => {},
    handleSubmit,
    setFieldValue: () => {},
    setFieldError: () => {},
    resetForm: () => {},
    setValues: () => {},
    error,
    isSuccess
  }
}

// Hook for file upload validation
export function useFileUpload(options: {
  maxFiles?: number
  maxSize?: number // in bytes
  allowedTypes?: string[]
  onSuccess?: (files: File[]) => void
  onError?: (error: string) => void
}) {
  const {
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ],
    onSuccess,
    onError
  } = options

  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const validateFiles = (newFiles: File[]): string[] => {
    const validationErrors: string[] = []

    if (files.length + newFiles.length > maxFiles) {
      validationErrors.push(`En fazla ${maxFiles} dosya yükleyebilirsiniz`)
    }

    newFiles.forEach(file => {
      if (file.size > maxSize) {
        validationErrors.push(`${file.name} dosyası çok büyük. Maksimum boyut: ${maxSize / (1024 * 1024)}MB`)
      }

      if (!allowedTypes.includes(file.type)) {
        validationErrors.push(`${file.name} dosya türü desteklenmiyor`)
      }
    })

    return validationErrors
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const validationErrors = validateFiles(selectedFiles)

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      onError?.(validationErrors.join(', '))
      return
    }

    setErrors([])
    setFiles(prev => [...prev, ...selectedFiles])
    onSuccess?.([...files, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setFiles([])
    setErrors([])
  }

  return {
    files,
    errors,
    isUploading,
    handleFileChange,
    removeFile,
    clearFiles,
    setFiles
  }
}