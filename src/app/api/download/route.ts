import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    const filePath = join(process.cwd(), 'uploads', 'contracts', filename)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Extract original filename from the stored filename
    const originalName = filename.split('-').slice(2).join('-')

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${originalName}"`,
        'Content-Type': 'application/octet-stream',
      },
    })

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}