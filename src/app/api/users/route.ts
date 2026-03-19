import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware, parseRequestBody } from '@/lib/apiUtils'
import { ValidationError } from '@/lib/errors'
import { randomBytes, scryptSync } from 'crypto'

async function handler(req: NextRequest) {
  if (req.method === 'GET') {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        companies: {
          select: { id: true, name: true }
        }
      }
    })
    return ApiResponse.success({ users })
  }

  if (req.method === 'POST') {
    const body = await parseRequestBody(req)
    const email = String(body.email || '').trim().toLowerCase()
    const name = String(body.name || '').trim()
    const password = String(body.password || '')
    const role = body.role === 'USER' ? 'USER' : 'ADMIN'
    const companyIds = Array.isArray(body.companyIds) ? body.companyIds : []

    const errors: Array<{ field: string; message: string }> = []
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'email', message: 'Geçerli bir e-posta girin' })
    }
    if (!name) {
      errors.push({ field: 'name', message: 'İsim zorunludur' })
    }
    if (!password || password.length < 6) {
      errors.push({ field: 'password', message: 'Parola en az 6 karakter olmalıdır' })
    }
    if (errors.length > 0) {
      return ApiResponse.validationError(errors as any)
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return ApiResponse.conflict('Bu e-posta ile kullanıcı zaten mevcut')
    }

    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(password, salt, 64).toString('hex')
    const passwordHash = `${salt}:${hash}`

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        companies: {
          connect: companyIds.map((id: string) => ({ id }))
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        companies: { select: { id: true, name: true } }
      }
    })
    return ApiResponse.success(user, 'User created', 201)
  }

  if (req.method === 'PUT') {
    const body = await parseRequestBody(req)
    const id = String(body.id || '')
    const name = body.name !== undefined ? String(body.name).trim() : undefined
    const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined
    const role = body.role === 'ADMIN' || body.role === 'USER' ? body.role : undefined
    const password = body.password !== undefined ? String(body.password) : undefined
    const companyIds = Array.isArray(body.companyIds) ? body.companyIds : undefined

    if (!id) {
      return ApiResponse.validationError([{ field: 'id', message: 'Kullanıcı ID zorunludur' }] as any)
    }

    const existing = await db.user.findUnique({ where: { id } })
    if (!existing) {
      return ApiResponse.notFound('Kullanıcı bulunamadı')
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return ApiResponse.validationError([{ field: 'email', message: 'Geçerli bir e-posta girin' }] as any)
      }
      if (email !== existing.email) {
        const dup = await db.user.findUnique({ where: { email } })
        if (dup) {
          return ApiResponse.conflict('Bu e-posta ile kullanıcı zaten mevcut')
        }
      }
      data.email = email
    }
    if (role !== undefined) {
      if (existing.role === 'ADMIN' && role === 'USER') {
        const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
        if (adminCount <= 1) {
          return ApiResponse.validationError([{ field: 'role', message: 'Son ADMIN kullanıcı düşürülemez' }] as any)
        }
      }
      data.role = role
    }
    if (password !== undefined) {
      if (password.length < 6) {
        return ApiResponse.validationError([{ field: 'password', message: 'Parola en az 6 karakter olmalıdır' }] as any)
      }
      const salt = randomBytes(16).toString('hex')
      const hash = scryptSync(password, salt, 64).toString('hex')
      data.passwordHash = `${salt}:${hash}`
    }

    if (companyIds !== undefined) {
      data.companies = {
        set: companyIds.map((id: string) => ({ id }))
      }
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        companies: { select: { id: true, name: true } }
      }
    })
    return ApiResponse.success(user, 'User updated')
  }

  if (req.method === 'DELETE') {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || ''
    if (!id) {
      return ApiResponse.validationError([{ field: 'id', message: 'Kullanıcı ID zorunludur' }] as any)
    }
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return ApiResponse.notFound('Kullanıcı bulunamadı')
    }
    if (user.role === 'ADMIN') {
      const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return ApiResponse.validationError([{ field: 'id', message: 'Son ADMIN kullanıcı silinemez' }] as any)
      }
    }
    await db.user.delete({ where: { id } })
    return ApiResponse.success({ id }, 'User deleted')
  }

  return ApiResponse.error(new ValidationError('Method not allowed', 'method'), 405)
}

export const GET = withCommonMiddleware(handler)
export const POST = withCommonMiddleware(handler)
export const PUT = withCommonMiddleware(handler)
export const DELETE = withCommonMiddleware(handler)