import { NextResponse } from 'next/server'

export const POST = async () => {
  const res = NextResponse.json({ success: true, message: 'Çıkış yapıldı' })
  res.cookies.set('auth_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return res
}