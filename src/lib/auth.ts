import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
const b64urlToBytes = (input: string) => {
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (input.length % 4)) % 4)
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
}

export const getPayload = async (token?: string) => {
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

export async function getSession(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value
    const payload = await getPayload(token)
    if (!payload) {
        console.log('getSession: No valid token/payload')
        return null
    }

    const user = await db.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, name: true }
    })

    if (!user) {
        console.log(`getSession: User not found for ID: ${payload.sub}`)
    }

    return user
}
