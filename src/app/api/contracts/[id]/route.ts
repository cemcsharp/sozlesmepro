import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ApiResponse } from '@/lib/apiUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        department: true,
        company: true,
        category: true,
        type: true,
        currency: true,
        paymentFrequency: true,
        documents: true,
        notifications: {
          orderBy: { createdAt: 'desc' }
        },
        versions: {
          orderBy: { version: 'desc' }
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!contract) {
      return ApiResponse.notFound('Sözleşme bulunamadı')
    }

    // Calculate days until expiry
    const today = new Date()
    const endDate = new Date(contract.endDate)
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return ApiResponse.success({
      ...contract,
      daysUntilExpiry
    })

  } catch (error) {
    return ApiResponse.internalError('Sözleşme alınamadı')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const today = new Date()

    const {
      contractNumber,
      subject,
      description,
      startDate,
      endDate,
      amount,
      currency,
      category,
      type,
      paymentFrequency,
      companyRepresentative,
      contactInfo,
      internalResponsible,
      departmentId,
      status,
      createVersion,
      revertVersion,
      action,
      counterpartyName,
      counterpartyContact,
      counterpartyEmail,
      counterpartyPhone
    } = body

    // Check if contract exists
    const existingContract = await db.contract.findUnique({
      where: { id }
    })

    if (!existingContract) {
      return ApiResponse.notFound('Sözleşme bulunamadı')
    }

    const companyId = existingContract.companyId

    if (!companyId) {
      return ApiResponse.internalError('Sözleşme firma bilgisi eksik')
    }

    // Helper for looking up definitions (Category, Type, Currency, etc)
    const lookupDefinition = async (value: any, defType: any) => {
      if (!value) return undefined
      if (typeof value !== 'string') return undefined

      // If it's a valid ID (cuid or uuid), return it
      if (value.length > 20 || (value.startsWith('c') && value.length > 10)) {
        const defById = await db.contractDefinition.findFirst({
          where: { id: value, type: defType, companyId }
        })
        if (defById) return defById.id
      }

      // Try searching by name or code
      const defByNameOrCode = await db.contractDefinition.findFirst({
        where: {
          OR: [{ name: value }, { code: value }],
          type: defType,
          companyId
        }
      })
      return defByNameOrCode?.id
    }

    // Check if contract number is being changed and already exists
    if (contractNumber && contractNumber !== existingContract.contractNumber) {
      const duplicateContract = await db.contract.findFirst({
        where: {
          contractNumber,
          companyId: existingContract.companyId
        }
      })

      if (duplicateContract) {
        return ApiResponse.validationError([{ field: 'contractNumber', message: 'Bu sözleşme numarası bu firmada zaten mevcut' }])
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (contractNumber !== undefined) updateData.contractNumber = contractNumber
    if (subject !== undefined) updateData.subject = subject
    if (description !== undefined) updateData.description = description || null
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (amount !== undefined) updateData.amount = parseFloat(String(amount).replace(',', '.'))
    if (status !== undefined) updateData.status = status
    if (departmentId !== undefined) updateData.departmentId = departmentId

    // Additional fields
    if (companyRepresentative !== undefined) updateData.companyRepresentative = companyRepresentative
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo
    if (internalResponsible !== undefined) updateData.internalResponsible = internalResponsible
    if (counterpartyName !== undefined) updateData.counterpartyName = counterpartyName
    if (counterpartyContact !== undefined) updateData.counterpartyContact = counterpartyContact
    if (counterpartyEmail !== undefined) updateData.counterpartyEmail = counterpartyEmail
    if (counterpartyPhone !== undefined) updateData.counterpartyPhone = counterpartyPhone

    // Definitions lookup
    const foundCurrencyId = await lookupDefinition(currency, 'CURRENCY')
    if (foundCurrencyId) updateData.currencyId = foundCurrencyId

    const foundCategoryId = await lookupDefinition(category, 'CONTRACT_CATEGORY')
    if (foundCategoryId) updateData.categoryId = foundCategoryId

    const foundTypeId = await lookupDefinition(type, 'CONTRACT_TYPE')
    if (foundTypeId) updateData.typeId = foundTypeId

    const foundPFId = await lookupDefinition(paymentFrequency, 'PAYMENT_FREQUENCY')
    if (foundPFId) updateData.paymentFrequencyId = foundPFId

    // Handle revert to a specific version
    if (action === 'revert' && typeof revertVersion === 'number') {
      const version = await db.contractVersion.findFirst({
        where: { contractId: id, version: revertVersion }
      })
      if (!version) {
        return ApiResponse.notFound('İstenen versiyon bulunamadı')
      }
      const data = version.data as any
      const reverted = await db.contract.update({
        where: { id },
        data: {
          contractNumber: data.contractNumber,
          subject: data.subject,
          description: data.description ?? null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          amount: parseFloat(data.amount),
          currencyId: data.currencyId,
          categoryId: data.categoryId,
          typeId: data.typeId,
          paymentFrequencyId: data.paymentFrequencyId,
          departmentId: data.departmentId,
          status: data.status,
          companyRepresentative: data.companyRepresentative,
          contactInfo: data.contactInfo,
          internalResponsible: data.internalResponsible,
          counterpartyPhone: data.counterpartyPhone
        },
        include: {
          department: true,
          documents: true,
          notifications: { orderBy: { createdAt: 'desc' } },
          versions: { orderBy: { version: 'desc' } },
          changeLogs: { orderBy: { createdAt: 'desc' } }
        }
      })
      return ApiResponse.success(reverted)
    }

    // Execute Update
    const updatedContract = await db.contract.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        company: true,
        category: true,
        type: true,
        currency: true,
        paymentFrequency: true,
        documents: true,
        notifications: { orderBy: { createdAt: 'desc' } }
      }
    })

    // Handle documents
    const addedDocuments = Array.isArray((body as any).addedDocuments) ? (body as any).addedDocuments : []
    const removedDocumentIds = Array.isArray((body as any).removedDocumentIds) ? (body as any).removedDocumentIds : []

    if (addedDocuments.length > 0) {
      await db.contractDocument.createMany({
        data: addedDocuments.map((d: any) => ({
          filename: d.filename,
          originalName: d.originalName,
          filePath: d.filePath,
          fileSize: d.fileSize,
          mimeType: d.mimeType,
          contractId: id
        }))
      })
    }

    if (removedDocumentIds.length > 0) {
      await db.contractDocument.deleteMany({
        where: { id: { in: removedDocumentIds }, contractId: id }
      })
    }

    // Change Logs
    const changes: any[] = []
    const fieldsToTrack = [
      'contractNumber', 'subject', 'description', 'startDate', 'endDate',
      'amount', 'status', 'departmentId', 'categoryId', 'typeId', 'currencyId',
      'paymentFrequencyId', 'companyRepresentative', 'contactInfo', 'internalResponsible',
      'counterpartyPhone'
    ]

    for (const field of fieldsToTrack) {
      const newVal = updateData[field]
      const oldVal = (existingContract as any)[field]

      if (newVal !== undefined) {
        const norm = (v: any) => v instanceof Date ? v.toISOString() : String(v ?? '')
        if (norm(oldVal) !== norm(newVal)) {
          changes.push({ contractId: id, field, oldValue: norm(oldVal), newValue: norm(newVal) })
        }
      }
    }

    if (changes.length > 0) {
      await db.contractChangeLog.createMany({ data: changes })
    }

    // Versioning
    if (createVersion) {
      const last = await db.contractVersion.findFirst({
        where: { contractId: id },
        orderBy: { version: 'desc' }
      })
      await db.contractVersion.create({
        data: {
          contractId: id,
          version: (last?.version ?? 0) + 1,
          data: {
            ...updatedContract,
            // Ensure no circular refs if any
          }
        }
      })
    }

    // Notifications update if endDate changed
    if (endDate) {
      await db.notification.deleteMany({ where: { contractId: id } })
      const expiryDays = Math.ceil((new Date(endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const alerts = [30, 15, 7, 1]
      const notifications = alerts
        .filter(d => expiryDays <= d && expiryDays > 0)
        .map(d => ({
          contractId: id,
          type: 'EXPIRATION_WARNING' as const,
          daysBefore: d,
          subject: `Sözleşme Uyarısı: ${subject || updatedContract.subject}`,
          message: `${subject || updatedContract.subject} sözleşmesi ${d} gün içinde sona erecek.`,
          isSent: false
        }))

      if (notifications.length > 0) {
        await db.notification.createMany({ data: notifications })
      }
    }

    // Final Response
    const finalContract = await db.contract.findUnique({
      where: { id },
      include: {
        department: true,
        company: true,
        category: true,
        type: true,
        currency: true,
        paymentFrequency: true,
        documents: true,
        notifications: { orderBy: { createdAt: 'desc' } },
        versions: { orderBy: { version: 'desc' } },
        changeLogs: { orderBy: { createdAt: 'desc' } }
      }
    })

    const finalEndDate = new Date(finalContract?.endDate || updatedContract.endDate)
    const finalDays = Math.ceil((finalEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return ApiResponse.success({ ...finalContract, daysUntilExpiry: finalDays })

  } catch (error: any) {
    console.error('Sözleşme güncelleme hatası:', error)
    return ApiResponse.internalError(`Sözleşme güncelleme başarısız: ${error.message}`)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if contract exists
    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        documents: true,
        notifications: true
      }
    })

    if (!contract) {
      return ApiResponse.notFound('Sözleşme bulunamadı')
    }

    // Delete contract (Cascade handles documents, notifications, versions, changeLogs)
    await db.contract.delete({
      where: { id }
    })

    return ApiResponse.success({ message: 'Sözleşme silindi' })

  } catch (error) {
    return ApiResponse.internalError('Sözleşme silinemedi')
  }
}