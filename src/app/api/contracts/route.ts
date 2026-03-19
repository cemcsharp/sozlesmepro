import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

import { ApiResponse, withCommonMiddleware, parseRequestBody, validateRequest, checkRateLimit } from '@/lib/apiUtils'
import { contractSchemaApi } from '@/lib/validation'
import { ValidationError, ConflictError } from '@/lib/errors'
import { sendEmail, getContractCreatedEmailTemplate } from '@/lib/email'

const handler = async (req: NextRequest) => {
  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(clientIp, 100, 60000)) {
    return ApiResponse.error(new ValidationError('Rate limit exceeded', 'rateLimit'), 429)
  }

  if (req.method === 'GET') {
    return await handleGet(req)
  }

  if (req.method === 'POST') {
    return await handlePost(req)
  }

  return ApiResponse.error(new ValidationError('Method not allowed', 'method'), 405)
}

const handleGet = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const department = searchParams.get('department') || ''
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const companyId = searchParams.get('companyId')

  const user = await getSession(req)
  if (!user) return ApiResponse.unauthorized()

  let whereClause: any = {}

  // Multi-tenancy enforcement
  if (user.role !== 'ADMIN') {
    // Regular users MUST have a companyId selected, and it MUST be one they are authorized for
    if (!companyId) {
      return ApiResponse.success({ contracts: [], total: 0 }) // Or fetch authorized list - safer to return empty if no selection
    }

    // Check if user is associated with this company
    const association = await db.user.findFirst({
      where: {
        id: user.id,
        companies: { some: { id: companyId } }
      }
    })

    if (!association) {
      return ApiResponse.forbidden('Bu şirket için yetkiniz yok')
    }
  }

  // Filter by Company
  if (companyId) {
    whereClause.companyId = companyId
  }


  // Search filter
  if (search) {
    whereClause.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { department: { name: { contains: search, mode: 'insensitive' } } }
    ]
  }

  // Status filter
  if (status && status !== 'all') {
    whereClause.status = status
  }

  // Department filter
  if (department && department !== 'all') {
    whereClause.departmentId = department
  }

  // Date range filter
  if (dateFrom || dateTo) {
    whereClause.endDate = {}
    if (dateFrom) {
      whereClause.endDate.gte = new Date(dateFrom)
    }
    if (dateTo) {
      whereClause.endDate.lte = new Date(dateTo)
    }
  }

  const contracts = await db.contract.findMany({
    where: whereClause,
    include: {
      department: true,
      currency: true,
      documents: true,
      notifications: {
        where: { isSent: false }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate days until expiry for each contract
  const contractsWithExpiry = contracts.map(contract => {
    const today = new Date()
    const endDate = new Date(contract.endDate)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return {
      ...contract,
      daysUntilExpiry
    }
  })

  return ApiResponse.success({
    contracts: contractsWithExpiry,
    total: contractsWithExpiry.length
  })
}

const handlePost = async (req: NextRequest) => {
  const body = await parseRequestBody(req)

  // Custom validation for now since schema lib might need updates
  // In a real app, update zod schemas in lib/validation
  const {
    subject,
    description,
    startDate,
    endDate,
    amount,
    currency,
    departmentId,
    companyId,
    category,
    type,
    paymentFrequency,
    companyRepresentative,
    contactInfo,
    internalResponsible,
    counterpartyName,
    counterpartyContact,
    counterpartyEmail,
    counterpartyPhone,
    status = 'ACTIVE'
  } = body

  if (!subject || !startDate || !endDate || !departmentId || !companyId) {
    return ApiResponse.error(new ValidationError('Missing required fields', 'required'), 400)
  }

  const user = await getSession(req)
  if (!user) return ApiResponse.unauthorized()

  if (user.role !== 'ADMIN') {
    const association = await db.user.findFirst({
      where: {
        id: user.id,
        companies: { some: { id: companyId } }
      }
    })
    if (!association) return ApiResponse.forbidden('Bu şirket için yetkiniz yok')
  }


  // Validate company exists and get prefix
  const company = await db.company.findUnique({
    where: { id: companyId }
  })

  if (!company) {
    throw new ValidationError('Company not found', 'companyId')
  }

  // Validate department exists
  const department = await db.department.findUnique({
    where: { id: departmentId }
  })

  if (!department) {
    throw new ValidationError('Department not found', 'departmentId')
  }

  // Generate Contract Number: PREFIX-YEAR-SEQ
  const year = new Date().getFullYear()
  const prefix = company.prefix

  // Find last contract for this company in this year to determine sequence
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31, 23, 59, 59)

  const count = await db.contract.count({
    where: {
      companyId,
      createdAt: {
        gte: startOfYear,
        lte: endOfYear
      }
    }
  })

  const sequence = String(count + 1).padStart(3, '0')
  const contractNumber = `${prefix}-${year}-${sequence}`

  const documents = Array.isArray((body as any).documents) ? (body as any).documents : []

  // Look up ContractDefinition IDs by code and companyId
  const lookupDefinition = async (value: string | undefined, defType: string) => {
    if (!value) return undefined

    // If it looks like a CUID (starts with c) or UUID, try finding by ID first
    if (value.length > 20 || (value.startsWith('c') && value.length > 10)) {
      const defById = await db.contractDefinition.findFirst({
        where: { id: value, type: defType as any, companyId }
      })
      if (defById) return defById.id
    }

    // Otherwise, find by code
    const defByCode = await db.contractDefinition.findFirst({
      where: { code: value, type: defType as any, companyId }
    })
    return defByCode?.id
  }

  const categoryId = await lookupDefinition(category, 'CONTRACT_CATEGORY')
  const typeId = await lookupDefinition(type, 'CONTRACT_TYPE')
  const currencyId = await lookupDefinition(currency, 'CURRENCY')
  const paymentFrequencyId = await lookupDefinition(paymentFrequency, 'PAYMENT_FREQUENCY')

  // Create contract
  const contract = await db.contract.create({
    data: {
      contractNumber,
      subject,
      description: description || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      amount: parseFloat(amount) || 0,
      status,
      departmentId,
      companyId,
      categoryId: categoryId || undefined,
      typeId: typeId || undefined,
      currencyId: currencyId || undefined,
      paymentFrequencyId: paymentFrequencyId || undefined,
      companyRepresentative,
      contactInfo,
      internalResponsible,
      counterpartyName,
      counterpartyContact,
      counterpartyEmail,
      counterpartyPhone
    },
    include: {
      department: true,
      company: true,
      category: true,
      type: true,
      currency: true,
      paymentFrequency: true,
      documents: true,
      notifications: true
    }
  })

  // Attach uploaded documents if provided
  if (documents.length > 0) {
    const docsToCreate = documents.map((d: any) => ({
      filename: d.filename,
      originalName: d.originalName,
      filePath: d.filePath,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      type: d.type || 'ATTACHMENT',
      contractId: contract.id
    }))
    await db.contractDocument.createMany({ data: docsToCreate })
  }

  // Create notifications for upcoming expiry
  const today = new Date()
  const end = new Date(endDate)
  const daysUntilExpiry = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const notificationDays = [30, 15, 7, 1]
  const notificationsToCreate: Array<{
    contractId: string
    type: 'EXPIRATION_WARNING'
    daysBefore: number
    subject: string
    message: string
    isSent: boolean
  }> = []

  for (const days of notificationDays) {
    if (daysUntilExpiry <= days && daysUntilExpiry > 0) {
      notificationsToCreate.push({
        contractId: contract.id,
        type: 'EXPIRATION_WARNING',
        daysBefore: days,
        subject: `Sözleşme Uyarısı: ${subject}`,
        message: `${subject} sözleşmesi ${days} gün içinde sona erecek. Sözleşme No: ${contractNumber}`,
        isSent: false
      })
    }
  }

  if (notificationsToCreate.length > 0) {
    await db.notification.createMany({
      data: notificationsToCreate
    })
  }

  // Get the created contract with notifications
  const contractWithNotifications = await db.contract.findUnique({
    where: { id: contract.id },
    include: {
      department: true,
      company: true,
      category: true,
      type: true,
      currency: true,
      paymentFrequency: true,
      documents: true,
      notifications: true
    }
  })

  // Send email notification
  try {
    const departmentEmail = department?.email
    if (departmentEmail) {
      const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contracts/view/${contract.id}`
      await sendEmail({
        to: departmentEmail,
        subject: `Yeni Sözleşme: ${contractNumber} - ${subject}`,
        html: getContractCreatedEmailTemplate(contractNumber, subject, link)
      })
    }
  } catch (emailError) {
    console.error('Email notification failed (non-blocking):', emailError)
  }

  return ApiResponse.success({
    ...contractWithNotifications,
    daysUntilExpiry
  }, 'Contract created successfully', 201)
}

export const GET = withCommonMiddleware(handler)
export const POST = withCommonMiddleware(handler)