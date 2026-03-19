import { NextRequest, NextResponse } from 'next/server'

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
const b64urlToBytes = (input: string) => {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (input.length % 4)) % 4)
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const verifyToken = async (token?: string) => {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [dataB64, sig] = parts
  const bytes = b64urlToBytes(dataB64)
  const dataStr = new TextDecoder().decode(bytes)
  let payload: any
  try {
    payload = JSON.parse(dataStr)
  } catch {
    return false
  }
  const secret = process.env.AUTH_SECRET || 'dev-secret'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, bytes)
  const expectedSig = toHex(signature)
  if (expectedSig !== sig) return false
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false
  return true
}

const getTokenPayload = async (token?: string) => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [dataB64, sig] = parts
  const bytes = b64urlToBytes(dataB64)
  const dataStr = new TextDecoder().decode(bytes)
  let payload: any
  try { payload = JSON.parse(dataStr) } catch { return null }
  const secret = process.env.AUTH_SECRET || 'dev-secret'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, bytes)
  const expectedSig = toHex(signature)
  if (expectedSig !== sig) return null
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null
  return payload
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  const token = request.cookies.get('auth_token')?.value
  const payload = await getTokenPayload(token)
  const isAuth = !!payload

  const publicView = request.cookies.get('public_view')?.value === '1'
  const contractId = request.cookies.get('public_contract_id')?.value

  const isAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/logo') || pathname === '/robots.txt'
  const isLogin = pathname === '/login'
  const isAuthApi = pathname.startsWith('/api/auth')

  if (isAsset || isAuthApi || isLogin) {
    return NextResponse.next()
  }

  if (!isAuth) {
    // Allow switching to any public contract view when ?public=1 is present
    if (pathname.startsWith('/contracts/view/')) {
      const pathContractId = pathname.split('/').pop() || ''
      if (url.searchParams.get('public') === '1' && pathContractId) {
        const res = NextResponse.next()
        // Override cookies to the current path contract id
        res.cookies.set('public_view', '1', { path: '/', maxAge: 3 * 24 * 60 * 60 })
        res.cookies.set('public_contract_id', pathContractId, { path: '/', maxAge: 3 * 24 * 60 * 60 })
        return res
      }
    }

    if (publicView && contractId) {
      const isAllowedView = pathname === `/contracts/view/${contractId}`
      const isAllowedApi = pathname === `/api/contracts/${contractId}` || pathname.startsWith('/api/download')
      if (isAllowedView) {
        if (url.searchParams.get('public') !== '1') {
          const redirectUrl = new URL(url)
          redirectUrl.searchParams.set('public', '1')
          return NextResponse.redirect(redirectUrl)
        }
        return NextResponse.next()
      }
      if (isAllowedApi) {
        return NextResponse.next()
      }
      const redirect = new URL(`/contracts/view/${contractId}`, url.origin)
      redirect.searchParams.set('public', '1')
      return NextResponse.redirect(redirect)
    }

    if (pathname.startsWith('/api')) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Giriş yapın' }, { status: 401 })
    }
    const redirectUrl = new URL('/login', url.origin)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname.startsWith('/settings')) {
    const role = (payload as any)?.role
    if (role !== 'ADMIN') {
      const redirectUrl = new URL('/', url.origin)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon|logo).*)'],
}