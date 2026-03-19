import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware, parseRequestBody } from '@/lib/apiUtils'
import { getSession } from '@/lib/auth'
import { scryptSync, randomBytes } from 'crypto'

async function handler(req: NextRequest) {
    const session = await getSession(req)
    if (!session) {
        return ApiResponse.unauthorized('Giriş yapmanız gerekiyor')
    }

    const userId = session.id

    if (req.method === 'GET') {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            }
        })

        if (!user) {
            return ApiResponse.notFound('Kullanıcı bulunamadı')
        }

        return ApiResponse.success(user)
    }

    if (req.method === 'PUT') {
        const body = await parseRequestBody(req)
        const { name, password } = body

        const data: any = {}

        if (name !== undefined) {
            const trimmedName = String(name).trim()
            if (!trimmedName) {
                return ApiResponse.validationError([{ field: 'name', message: 'İsim boş bırakılamaz' }] as any)
            }
            data.name = trimmedName
        }

        if (password !== undefined && String(password).length > 0) {
            if (String(password).length < 6) {
                return ApiResponse.validationError([{ field: 'password', message: 'Şifre en az 6 karakter olmalıdır' }] as any)
            }
            const salt = randomBytes(16).toString('hex')
            const hash = scryptSync(password, salt, 64).toString('hex')
            data.passwordHash = `${salt}:${hash}`
        }

        if (Object.keys(data).length === 0) {
            return ApiResponse.validationError([{ field: 'general', message: 'Güncellenecek veri bulunamadı' }] as any)
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        })

        return ApiResponse.success(updatedUser, 'Profil başarıyla güncellendi')
    }

    return ApiResponse.error(new Error('Method not allowed'), 405)
}

export const GET = withCommonMiddleware(handler)
export const PUT = withCommonMiddleware(handler)
