import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getSession(request)

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Giriş yapın' }, { status: 401 })
  }

  return NextResponse.json({ success: true, data: { email: user.email, role: user.role, name: user.name } })
}