import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/definitions?companyId=...&type=...
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const type = searchParams.get('type') // Optional: filter by DefinitionType

    if (!companyId) {
        return NextResponse.json(
            { success: false, message: 'Company ID is required' },
            { status: 400 }
        )
    }

    try {
        const definitions = await db.contractDefinition.findMany({
            where: {
                companyId,
                ...(type && { type: type as any }), // Cast to any to avoid strict enum type checking issues here, or import DefinitionType
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json({ success: true, data: definitions })
    } catch (error) {
        console.error('Error fetching definitions:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch definitions' },
            { status: 500 }
        )
    }
}

// POST /api/definitions
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { companyId, type, name, code } = body

        if (!companyId || !type || !name) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            )
        }

        const definition = await db.contractDefinition.create({
            data: {
                companyId,
                type,
                name,
                code: code?.toUpperCase(),
                isActive: true
            }
        })

        return NextResponse.json({ success: true, data: definition })
    } catch (error) {
        console.error('Error creating definition:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to create definition' },
            { status: 500 }
        )
    }
}

// PUT /api/definitions?id=... (Toggle Active / Update)
export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        const body = await req.json()

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID is required' },
                { status: 400 }
            )
        }

        const definition = await db.contractDefinition.update({
            where: { id },
            data: body // Expecting { name, code, isActive }
        })

        return NextResponse.json({ success: true, data: definition })
    } catch (error) {
        console.error('Error updating definition:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to update definition' },
            { status: 500 }
        )
    }
}

// DELETE /api/definitions?id=...
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'ID is required' },
                { status: 400 }
            )
        }

        // Check usage before delete
        // We could do a soft delete or check relations count, but for simplicity we try delete
        // and if it fails (due to foreign key constraints), we suggest deactivating.

        try {
            await db.contractDefinition.delete({
                where: { id }
            })
            return NextResponse.json({ success: true, message: 'Deleted successfully' })
        } catch (e: any) {
            // P2003 is foreign key constraint failed
            if (e.code === 'P2003') {
                return NextResponse.json(
                    { success: false, message: 'This definition is in use. Please deactivate it instead.' },
                    { status: 409 }
                )
            }
            throw e
        }

    } catch (error) {
        console.error('Error deleting definition:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to delete definition' },
            { status: 500 }
        )
    }
}
