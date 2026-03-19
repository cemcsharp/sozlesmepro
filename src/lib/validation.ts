import { z } from 'zod'

// Contract validation schemas
export const contractSchema = z.object({
  contractNumber: z.string()
    .min(1, 'Sözleşme numarası zorunludur')
    .max(50, 'Sözleşme numarası en fazla 50 karakter olabilir')
    .regex(/^[A-Za-z0-9\-\/]+$/, 'Sözleşme numarası sadece harf, rakam, - ve / içerebilir'),
  
  subject: z.string()
    .min(1, 'Sözleşme konusu zorunludur')
    .max(200, 'Sözleşme konusu en fazla 200 karakter olabilir'),
  
  description: z.string()
    .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
    .optional()
    .nullable(),
  
  startDate: z.date(),
  
  endDate: z.date(),
  
  amount: z.string()
    .min(1, 'Tutar zorunludur')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Tutar 0\'dan büyük bir sayı olmalıdır'
    }),
  
  currency: z.string()
    .min(3, 'Para birimi zorunludur')
    .max(3, 'Para birimi 3 karakter olmalıdır'),
  
  departmentId: z.string()
    .min(1, 'Birim seçimi zorunludur'),
  
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'])
}).refine((data) => data.endDate > data.startDate, {
  message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
  path: ['endDate']
})

// API (JSON) contract schema for server-side validation
export const contractSchemaApi = z.object({
  contractNumber: z.string()
    .min(1, 'Sözleşme numarası zorunludur')
    .max(50, 'Sözleşme numarası en fazla 50 karakter olabilir')
    .regex(/^[A-Za-z0-9\-\/]+$/, 'Sözleşme numarası sadece harf, rakam, - ve / içerebilir'),

  subject: z.string()
    .min(1, 'Sözleşme konusu zorunludur')
    .max(200, 'Sözleşme konusu en fazla 200 karakter olabilir'),

  description: z.string()
    .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
    .optional()
    .nullable(),

  startDate: z.string()
    .min(1, 'Başlangıç tarihi zorunludur')
    .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Geçerli bir başlangıç tarihi girin' }),

  endDate: z.string()
    .min(1, 'Bitiş tarihi zorunludur')
    .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Geçerli bir bitiş tarihi girin' }),

  amount: z.number()
    .positive('Tutar 0\'dan büyük bir sayı olmalıdır'),

  currency: z.string()
    .min(3, 'Para birimi zorunludur')
    .max(3, 'Para birimi 3 karakter olmalıdır'),

  departmentId: z.string()
    .min(1, 'Birim seçimi zorunludur'),

  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'])
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır',
  path: ['endDate']
})

// Department validation schema
export const departmentSchema = z.object({
  name: z.string()
    .min(1, 'Birim adı zorunludur')
    .max(100, 'Birim adı en fazla 100 karakter olabilir')
    .regex(/^[a-zA-Z0-9ğĞıİöÖşŞüÜçÇ\s]+$/, 'Birim adı sadece harf, rakam ve boşluk içerebilir'),
  
  email: z.string()
    .min(1, 'E-posta adresi zorunludur')
    .max(100, 'E-posta adresi en fazla 100 karakter olabilir')
    .email('Geçerli bir e-posta adresi girin'),
  
  description: z.string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional()
    .nullable()
})

// SMTP Configuration validation schema
export const smtpConfigSchema = z.object({
  name: z.string()
    .min(1, 'Yapılandırma adı zorunludur')
    .max(50, 'Yapılandırma adı en fazla 50 karakter olabilir'),
  
  host: z.string()
    .min(1, 'Sunucu adresi zorunludur')
    .max(100, 'Sunucu adresi en fazla 100 karakter olabilir'),
  
  port: z.number()
    .min(1, 'Port numarası 1\'den büyük olmalıdır')
    .max(65535, 'Port numarası 65535\'ten küçük olmalıdır'),
  
  username: z.string()
    .min(1, 'Kullanıcı adı zorunludur')
    .max(100, 'Kullanıcı adı en fazla 100 karakter olabilir'),
  
  password: z.string()
    .min(1, 'Parola zorunludur')
    .max(100, 'Parola en fazla 100 karakter olabilir'),
  
  fromEmail: z.string()
    .min(1, 'Gönderen e-posta zorunludur')
    .max(100, 'Gönderen e-posta en fazla 100 karakter olabilir')
    .email('Geçerli bir gönderen e-posta adresi girin'),
  
  fromName: z.string()
    .min(1, 'Gönderen adı zorunludur')
    .max(50, 'Gönderen adı en fazla 50 karakter olabilir'),
  
  secure: z.boolean()
    .default(true),
  
  isActive: z.boolean()
    .default(false)
})

// File upload validation
export const fileUploadSchema = z.object({
  files: z.array(z.instanceof(File))
    .min(1, 'En az bir dosya seçmelisiniz')
    .max(10, 'En fazla 10 dosya yükleyebilirsiniz'),
  
  maxSize: z.number()
    .default(10 * 1024 * 1024) // 10MB
})

// Helper functions for validation
export const validateContract = (data: any) => {
  try {
    const result = contractSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Bilinmeyen doğrulama hatası' }] }
  }
}

export const validateDepartment = (data: any) => {
  try {
    const result = departmentSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Bilinmeyen doğrulama hatası' }] }
  }
}

export const validateSmtpConfig = (data: any) => {
  try {
    const result = smtpConfigSchema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Bilinmeyen doğrulama hatası' }] }
  }
}

export const validateFiles = (files: File[], maxSize: number = 10 * 1024 * 1024) => {
  const errors: Array<{ field: string; message: string }> = []
  
  if (files.length === 0) {
    errors.push({ field: 'files', message: 'En az bir dosya seçmelisiniz' })
  }
  
  if (files.length > 10) {
    errors.push({ field: 'files', message: 'En fazla 10 dosya yükleyebilirsiniz' })
  }
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
  
  files.forEach((file, index) => {
    if (file.size > maxSize) {
      errors.push({ 
        field: `files.${index}`, 
        message: `${file.name} dosyası çok büyük. Maksimum boyut: ${maxSize / (1024 * 1024)}MB` 
      })
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push({ 
        field: `files.${index}`, 
        message: `${file.name} dosya türü desteklenmiyor. Desteklenen türler: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF` 
      })
    }
  })
  
  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

// Type definitions
export type ContractFormData = z.infer<typeof contractSchema>
export type DepartmentFormData = z.infer<typeof departmentSchema>
export type SmtpConfigFormData = z.infer<typeof smtpConfigSchema>

// Error types
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}