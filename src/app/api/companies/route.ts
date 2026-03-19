import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0


export async function GET(request: NextRequest) {
  try {
    const user = await getSession(request)
    if (!user) {
      console.log('GET /api/companies: No session found')
      return NextResponse.json({ success: false, message: 'Oturum açılmadı' }, { status: 401 })
    }

    console.log(`GET /api/companies: User ${user.email} (Role: ${user.role}, ID: ${user.id})`)

    let companies: any[] = []

    if (user.role === 'ADMIN') {
      companies = await prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { contracts: true, users: true, departments: true }
          }
        }
      })
      console.log(`GET /api/companies: Admin view, found ${companies.length} companies`)
    } else {
      const userWithCompanies = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          companies: {
            orderBy: { createdAt: 'desc' },
            include: {
              _count: {
                select: { contracts: true, users: true, departments: true }
              }
            }
          }
        }
      })
      companies = userWithCompanies?.companies || []
      console.log(`GET /api/companies: User view, found ${companies.length} companies for ID ${user.id}`)
    }

    return NextResponse.json({ success: true, data: companies })
  } catch (error: any) {
    console.error('GET /api/companies error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, prefix, email, phone, address, taxNumber, website } = body

    if (!name || !prefix) {
      return NextResponse.json({
        success: false,
        message: 'Şirket adı ve kısaltma kodu (Prefix) zorunludur.'
      }, { status: 400 })
    }

    // Check uniqueness of prefix
    const existing = await prisma.company.findUnique({ where: { prefix } })
    if (existing) {
      return NextResponse.json({
        success: false,
        message: 'Bu kısaltma kodu (Prefix) zaten kullanılıyor. Lütfen başka bir kod seçin.'
      }, { status: 400 })
    }

    const company = await prisma.company.create({
      data: {
        name,
        prefix: prefix.toUpperCase(),
        email,
        phone,
        address,
        taxNumber,
        website
      }
    })

    return NextResponse.json({ success: true, data: company })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, prefix, email, phone, address, taxNumber, website } = body

    if (!id || !name || !prefix) {
      return NextResponse.json({
        success: false,
        message: 'ID, Şirket adı ve kısaltma kodu (Prefix) zorunludur.'
      }, { status: 400 })
    }

    // Check uniqueness of prefix if changed
    const existing = await prisma.company.findUnique({ where: { prefix } })
    if (existing && existing.id !== id) {
      return NextResponse.json({
        success: false,
        message: 'Bu kısaltma kodu (Prefix) zaten kullanılıyor.'
      }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        prefix: prefix.toUpperCase(),
        email,
        phone,
        address,
        taxNumber,
        website
      }
    })

    return NextResponse.json({ success: true, data: company })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ success: false, message: 'ID zorunludur' }, { status: 400 })
  }

  try {
    // Check relations
    const company = await prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { contracts: true } } }
    })

    if (company && company._count.contracts > 0) {
      return NextResponse.json({
        success: false,
        message: `Bu şirkete bağlı ${company._count.contracts} sözleşme var. Önce onları silmelisiniz.`
      }, { status: 400 })
    }

    await prisma.company.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Şirket silindi' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
