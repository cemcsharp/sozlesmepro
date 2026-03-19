import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse, withCommonMiddleware } from '@/lib/apiUtils'

async function getHandler(request: NextRequest) {
  try {
    const departments = await db.department.findMany({
      include: {
        _count: {
          select: {
            contracts: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const departmentsWithCount = departments.map(dept => ({
      ...dept,
      contractCount: dept._count.contracts
    }))

    return ApiResponse.success(departmentsWithCount)

  } catch (error) {
    return ApiResponse.internalError('Birimler alınamadı')
  }
}
export const GET = withCommonMiddleware(getHandler)

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, description } = body

    // Validate required fields
    if (!name || !email) {
      return ApiResponse.validationError([
        { field: 'name', message: 'Birim adı zorunludur' },
        { field: 'email', message: 'E-posta zorunludur' }
      ])
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return ApiResponse.validationError([{ field: 'email', message: 'Geçerli bir e-posta adresi girin' }])
    }

    // Check if department name already exists (within the same company)
    // Note: companyId should come from session/middleware
    const existingDepartment = await db.department.findFirst({
      where: { name }
    })

    if (existingDepartment) {
      return ApiResponse.validationError([{ field: 'name', message: 'Aynı adı taşıyan birim zaten mevcut' }])
    }

    // Check if email already exists (email is not unique in schema)
    const existingEmail = await db.department.findFirst({
      where: { email }
    })

    if (existingEmail) {
      return ApiResponse.validationError([{ field: 'email', message: 'Aynı e-posta ile birim zaten mevcut' }])
    }

    // Create department
    const department = await db.department.create({
      data: {
        name,
        email,
        description: description || null
      }
    })

    return ApiResponse.success(department)

  } catch (error) {
    return ApiResponse.internalError('Birim oluşturma başarısız')
  }
}
export const POST = withCommonMiddleware(postHandler)