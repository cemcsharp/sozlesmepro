import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { ApiResponse, withCommonMiddleware } from '@/lib/apiUtils'

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/rtf',
  'text/rtf',
  'image/jpeg',
  'image/png'
]

async function handler(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return ApiResponse.validationError([{ field: 'files', message: 'Dosya bulunamadı' }])
    }

    const maxSize = Number(process.env.MAX_FILE_SIZE || 10485760)
    const uploadDir = join(process.cwd(), 'uploads', 'contracts')

    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      return ApiResponse.internalError('Yükleme dizini oluşturulamadı')
    }

    const uploadedFiles: any[] = []

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return ApiResponse.validationError([{ field: 'type', message: `Geçersiz dosya türü: ${file.name}` }])
      }
      if (file.size > maxSize) {
        return ApiResponse.validationError([{ field: 'size', message: `Dosya boyutu aşıldı: ${file.name}` }])
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const filename = `${timestamp}-${randomId}.${fileExtension}`
      const filePath = join(uploadDir, filename)

      await writeFile(filePath, buffer)

      uploadedFiles.push({
        id: randomId,
        filename,
        originalName: file.name,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadDate: new Date().toISOString()
      })
    }

    return ApiResponse.success({ message: 'Dosyalar yüklendi', files: uploadedFiles })
  } catch (error) {
    console.error('[UPLOAD_ERROR]', error)
    return ApiResponse.internalError('Yükleme başarısız')
  }
}

export const POST = withCommonMiddleware(handler)