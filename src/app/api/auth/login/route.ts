import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { withCommonMiddleware, parseRequestBody } from '@/lib/apiUtils'
import { db } from '@/lib/db'

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16)
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

const verifyPassword = (password: string, stored: string) => {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  try {
    if (hashHex.length === 128) {
      const calcHex = crypto.scryptSync(password, saltHex, 64).toString('hex')
      const calc = Buffer.from(calcHex, 'hex')
      const expected = Buffer.from(hashHex, 'hex')
      return crypto.timingSafeEqual(calc, expected)
    } else {
      const salt = Buffer.from(saltHex, 'hex')
      const calc = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
      const expected = Buffer.from(hashHex, 'hex')
      return crypto.timingSafeEqual(calc, expected)
    }
  } catch {
    return false
  }
}

const sign = (payload: any, secret: string) => {
  const data = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex')
  const token = `${Buffer.from(data).toString('base64url')}.${sig}`
  return token
}

const verifyCredentials = (email: string, password: string) => {
  const expectedEmail = process.env.ADMIN_EMAIL || ''
  const expectedPassword = process.env.ADMIN_PASSWORD || ''
  return email === expectedEmail && password === expectedPassword
}

const handler = async (req: NextRequest) => {
  if (req.method !== 'POST') {
    return NextResponse.json({ success: false, error: 'MethodNotAllowed', message: 'Sadece POST desteklenir' }, { status: 405 })
  }

  const body = await parseRequestBody(req)
  const email = String((body as any).email || '')
  const password = String((body as any).password || '')

  if (!email || !password) {
    return NextResponse.json({ success: false, error: 'ValidationError', message: 'E-posta ve parola zorunludur' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })

  if (existing) {
    const ok = verifyPassword(password, existing.passwordHash)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Geçersiz giriş bilgileri' }, { status: 401 })
    }
    try {
      const parts = String(existing.passwordHash || '').split(':')
      const hashHex = parts[1] || ''
      if (hashHex.length !== 128) {
        const salt = crypto.randomBytes(16).toString('hex')
        const newHash = crypto.scryptSync(password, salt, 64).toString('hex')
        await db.user.update({ where: { id: existing.id }, data: { passwordHash: `${salt}:${newHash}` } })
      }
    } catch { }
    const now = Date.now()
    const exp = now + 7 * 24 * 60 * 60 * 1000
    const secret = process.env.AUTH_SECRET || 'dev-secret'
    const payload = { sub: existing.id, email, name: existing.name, role: existing.role, iat: now, exp }
    const token = sign(payload, secret)
    const res = NextResponse.json({ success: true, data: { user: { email, role: existing.role } }, message: 'Giriş başarılı' })
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    })
    return res
  }

  const adminCount = await db.user.count({ where: { role: 'ADMIN' } })
  const envOk = verifyCredentials(email, password)
  if (adminCount === 0 && envOk) {
    // Bootstrap: Create User, Company, and Department
    const companyName = process.env.DEFAULT_COMPANY_NAME || 'Varsayılan Şirket'
    const companyPrefix = 'VRS'

    const created = await db.$transaction(async (tx) => {
      // Create Company
      const company = await tx.company.create({
        data: {
          name: companyName,
          prefix: companyPrefix,
        }
      })

      // Create Department
      await tx.department.create({
        data: {
          name: 'Genel',
          companyId: company.id
        }
      })

      // Create User and link to Company
      return await tx.user.create({
        data: {
          email,
          name: 'Yönetici',
          passwordHash: hashPassword(password),
          role: 'ADMIN',
          companies: {
            connect: { id: company.id }
          }
        }
      })
    })

    const now = Date.now()
    // ... continue with login logic ...
    const exp = now + 7 * 24 * 60 * 60 * 1000
    const secret = process.env.AUTH_SECRET || 'dev-secret'
    const payload = { sub: created.id, email, name: created.name, role: created.role, iat: now, exp }
    const token = sign(payload, secret)
    const res = NextResponse.json({ success: true, data: { user: { email, role: created.role } }, message: 'Giriş başarılı' })
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    })
    return res
  }

  return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Geçersiz giriş bilgileri' }, { status: 401 })
}

export const POST = withCommonMiddleware(handler)