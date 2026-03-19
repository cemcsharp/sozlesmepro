import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function POST(request: NextRequest) {
  try {
    const { format, contracts } = await request.json()

    if (!format || !contracts) {
      return NextResponse.json(
        { error: 'Format and contracts are required' },
        { status: 400 }
      )
    }

    if (format === 'excel') {
      return await exportToExcel(contracts)
    } else if (format === 'pdf') {
      return await exportToPDF(contracts)
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "excel" or "pdf"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

async function exportToExcel(contracts: any[]) {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sözleşmeler')

    // 1. Şirket Başlığı ve Meta Bilgi
    worksheet.mergeCells('A1:I1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = 'SözleşmePRO - Kurumsal Sözleşme Raporu'
    titleCell.font = { name: 'Arial Black', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } } // Blue-800

    worksheet.mergeCells('A2:I2')
    const metaCell = worksheet.getCell('A2')
    metaCell.value = `Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')} | Toplam Sözleşme: ${contracts.length}`
    metaCell.font = { italic: true, size: 10 }
    metaCell.alignment = { horizontal: 'right' }

    // 2. Başlık Satırı (Header Row)
    const headerRow = worksheet.getRow(4)
    headerRow.values = [
      'Sözleşme No',
      'Konu',
      'Birim',
      'Başlangıç Tarihi',
      'Bitiş Tarihi',
      'Tutar',
      'Para Birimi',
      'Durum',
      'Kalan Gün'
    ]

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } } // Slate-700
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // 3. Veri Satırları
    contracts.forEach((contract, index) => {
      const row = worksheet.addRow([
        contract.contractNumber,
        contract.subject,
        contract.department,
        new Date(contract.startDate),
        new Date(contract.endDate),
        contract.amount,
        contract.currency,
        contract.status === 'ACTIVE' ? 'Aktif' :
          contract.status === 'EXPIRED' ? 'Süresi Dolmuş' :
            contract.status === 'TERMINATED' ? 'Feshedilmiş' : 'Yenilenmiş',
        contract.daysUntilExpiry > 0 ? `${contract.daysUntilExpiry} gün` : 'Süresi Dolmuş'
      ])

      // Alignment and Borders for data cells
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }

        // Date formatting for Start/End date columns
        if (colNumber === 4 || colNumber === 5) {
          cell.numFmt = 'dd.mm.yyyy'
          cell.alignment = { horizontal: 'center' }
        }

        // Amount formatting
        if (colNumber === 6) {
          cell.numFmt = '#,##0.00'
          cell.alignment = { horizontal: 'right' }
        }

        // Zebra striping
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        }
      })
    })

    // 4. Otomatik Filtre ve Freeze Panes
    worksheet.autoFilter = 'A4:I4'
    worksheet.views = [{ state: 'frozen', ySplit: 4 }]

    // 5. Otomatik Sütun Genişliği
    worksheet.columns.forEach((column, i) => {
      let maxLength = 0
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10
        if (columnLength > maxLength) maxLength = columnLength
      })
      column.width = maxLength < 12 ? 12 : maxLength + 2
    })

    // 6. Generate Buffer
    const excelBuffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(new Uint8Array(excelBuffer as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sozlesmeler_profesyonel_rapor.xlsx"',
      },
    })

  } catch (error) {
    console.error('Excel export error:', error)
    throw new Error('Excel export failed')
  }
}

async function exportToPDF(contracts: any[]) {
  try {
    // For PDF export, we'll create HTML content and convert it
    // This is a simplified version - in production, you might want to use a more robust PDF library
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sözleşme Raporu</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; }
          .status-aktif { color: green; }
          .status-suresi-dolmus { color: red; }
          .status-feshedilmis { color: gray; }
          .status-yenilenmis { color: blue; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sözleşme Raporu</h1>
          <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
          <p>Toplam Sözleşme: ${contracts.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Sözleşme No</th>
              <th>Konu</th>
              <th>Birim</th>
              <th>Başlangıç</th>
              <th>Bitiş</th>
              <th>Tutar</th>
              <th>Durum</th>
              <th>Kalan Gün</th>
            </tr>
          </thead>
          <tbody>
            ${contracts.map(contract => `
              <tr>
                <td>${contract.contractNumber}</td>
                <td>${contract.subject}</td>
                <td>${contract.department}</td>
                <td>${new Date(contract.startDate).toLocaleDateString('tr-TR')}</td>
                <td>${new Date(contract.endDate).toLocaleDateString('tr-TR')}</td>
                <td>${contract.amount} ${contract.currency}</td>
                <td class="status-${contract.status.toLowerCase()}">
                  ${contract.status === 'ACTIVE' ? 'Aktif' :
        contract.status === 'EXPIRED' ? 'Süresi Dolmuş' :
          contract.status === 'TERMINATED' ? 'Feshedilmiş' : 'Yenilenmiş'}
                </td>
                <td>${contract.daysUntilExpiry > 0 ? `${contract.daysUntilExpiry} gün` : 'Süresi Dolmuş'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="sozlesmeler.html"',
      },
    })

  } catch (error) {
    console.error('PDF export error:', error)
    throw new Error('PDF export failed')
  }
}