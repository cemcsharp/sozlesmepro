import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files.' },
        { status: 400 }
      )
    }

    // Read file
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Parse Excel file
    let data
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse Excel file' },
        { status: 400 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the file' },
        { status: 400 }
      )
    }

    // Validate and transform data
    const importedContracts: Array<{
      contractNumber: string
      subject: string
      description: string
      startDate: string
      endDate: string
      amount: number
      currency: string
      department: string
      departmentEmail: string
      status: string
    }> = []
    const errors: Array<{ row: number; error: string }> = []

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      const rowIndex = i + 2 // Excel rows are 1-indexed, plus header row

      try {
        // Validate required fields
        const requiredFields = ['Sözleşme No', 'Konu', 'Başlangıç Tarihi', 'Bitiş Tarihi', 'Tutar', 'Birim']
        const missingFields = requiredFields.filter(field => !row[field])

        if (missingFields.length > 0) {
          errors.push({
            row: rowIndex,
            error: `Missing required fields: ${missingFields.join(', ')}`
          })
          continue
        }

        // Parse and validate dates
        const startDate = new Date(row['Başlangıç Tarihi'])
        const endDate = new Date(row['Bitiş Tarihi'])

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push({
            row: rowIndex,
            error: 'Invalid date format'
          })
          continue
        }

        if (startDate >= endDate) {
          errors.push({
            row: rowIndex,
            error: 'End date must be after start date'
          })
          continue
        }

        // Parse amount
        const amount = parseFloat(row['Tutar'])
        if (isNaN(amount) || amount <= 0) {
          errors.push({
            row: rowIndex,
            error: 'Invalid amount'
          })
          continue
        }

        // Validate email if provided
        const departmentEmail = row['Birim E-posta'] || ''
        if (departmentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(departmentEmail)) {
          errors.push({
            row: rowIndex,
            error: 'Invalid email format'
          })
          continue
        }

        // Transform data
        const contract = {
          contractNumber: row['Sözleşme No'],
          subject: row['Konu'],
          description: row['Açıklama'] || '',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          amount: amount,
          currency: row['Para Birimi'] || 'TRY',
          department: row['Birim'],
          departmentEmail: departmentEmail,
          status: 'ACTIVE' // Default status
        }

        importedContracts.push(contract)

      } catch (error) {
        errors.push({
          row: rowIndex,
          error: 'Unexpected error processing row'
        })
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      totalRows: data.length,
      successfulImports: importedContracts.length,
      failedImports: errors.length,
      contracts: importedContracts,
      errors: errors
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    )
  }
}