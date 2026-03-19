import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, parseRequestBody } from '@/lib/apiUtils'
import { smtpConfigSchema } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const configs = await db.smtpConfig.findMany({ orderBy: { createdAt: 'desc' } })
    const sanitized = configs.map(({ password, ...rest }) => rest)
    return ApiResponse.success({ configs: sanitized })
  } catch (error) {
    return ApiResponse.internalError('SMTP yapılandırmaları alınamadı')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request)
    const validation = smtpConfigSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
      return ApiResponse.validationError(errors)
    }
    const data = validation.data

    if (data.isActive) {
      await db.smtpConfig.updateMany({ data: { isActive: false } })
    }

    const created = await db.smtpConfig.create({ data })
    const { password, ...rest } = created as any
    return ApiResponse.success(rest, 'SMTP yapılandırması oluşturuldu')
  } catch (error) {
    return ApiResponse.internalError('SMTP yapılandırması oluşturulamadı')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await parseRequestBody(request)
    const { action } = body

    if (action === 'set-active') {
      const { id } = body
      if (!id) {
        return ApiResponse.validationError([{ field: 'id', message: 'ID zorunludur' }])
      }
      const exists = await db.smtpConfig.findUnique({ where: { id } })
      if (!exists) {
        return ApiResponse.notFound('SMTP yapılandırması bulunamadı')
      }
      await db.smtpConfig.updateMany({ data: { isActive: false } })
      const updated = await db.smtpConfig.update({ where: { id }, data: { isActive: true } })
      const { password, ...rest } = updated as any
      return ApiResponse.success(rest, 'Aktif SMTP yapılandırması güncellendi')
    }

    if (action === 'update') {
      const { id, data } = body
      if (!id || !data) {
        return ApiResponse.validationError([
          { field: 'id', message: 'ID zorunludur' },
          { field: 'data', message: 'Güncelleme verisi zorunludur' }
        ])
      }

      const existing = await db.smtpConfig.findUnique({ where: { id } })
      if (!existing) {
        return ApiResponse.notFound('SMTP yapılandırması bulunamadı')
      }

      // Normalize: allow empty password to mean "unchanged"
      if (data && (data.password === '' || data.password === undefined || data.password === null)) {
        delete data.password
      }

      const partialSchema = smtpConfigSchema.partial()
      const v = partialSchema.safeParse(data)
      if (!v.success) {
        const errors = v.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message }))
        return ApiResponse.validationError(errors)
      }

      const updateData: any = { ...v.data }
      if (updateData.isActive === true) {
        await db.smtpConfig.updateMany({ data: { isActive: false } })
      }

      if (updateData.password === undefined || updateData.password === null || updateData.password === '') {
        delete updateData.password
      }

      const updated = await db.smtpConfig.update({ where: { id }, data: updateData })
      const { password, ...rest } = updated as any
      return ApiResponse.success(rest, 'SMTP yapılandırması güncellendi')
    }

    return ApiResponse.validationError([{ field: 'action', message: 'Geçersiz işlem' }])
  } catch (error) {
    return ApiResponse.internalError('SMTP yapılandırması güncellenemedi')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return ApiResponse.validationError([{ field: 'id', message: 'ID zorunludur' }])
    }
    const existing = await db.smtpConfig.findUnique({ where: { id } })
    if (!existing) {
      return ApiResponse.notFound('SMTP yapılandırması bulunamadı')
    }
    await db.smtpConfig.delete({ where: { id } })
    return ApiResponse.success({ id }, 'SMTP yapılandırması silindi')
  } catch (error) {
    return ApiResponse.internalError('SMTP yapılandırması silinemedi')
  }
}