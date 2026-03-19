import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const department = await db.department.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            _count: {
              select: {
                documents: true,
                notifications: true
              }
            }
          }
        }
      }
    })

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not found',
          message: 'Department with the specified ID does not exist'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: department
    })

  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch department',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, description } = body

    // Check if department exists
    const existingDepartment = await db.department.findUnique({
      where: { id }
    })

    if (!existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not found',
          message: 'Department with the specified ID does not exist'
        },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Department name and email are required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        },
        { status: 400 }
      )
    }

    // Check if department name is being changed and already exists
    if (name !== existingDepartment.name) {
      const duplicateDepartment = await db.department.findFirst({
        where: {
          name,
          companyId: existingDepartment.companyId
        }
      })

      if (duplicateDepartment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Department already exists',
            message: 'A department with this name already exists'
          },
          { status: 400 }
        )
      }
    }

    // Check if email is being changed and already exists (email is not unique)
    if (email !== existingDepartment.email) {
      const duplicateEmail = await db.department.findFirst({
        where: { email }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already exists',
            message: 'A department with this email already exists'
          },
          { status: 400 }
        )
      }
    }

    // Update department
    const updatedDepartment = await db.department.update({
      where: { id },
      data: {
        name,
        email,
        description: description || null
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully'
    })

  } catch (error) {
    console.error('Error updating department:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update department',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if department exists
    const department = await db.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contracts: true
          }
        }
      }
    })

    if (!department) {
      return NextResponse.json(
        {
          success: false,
          error: 'Department not found',
          message: 'Department with the specified ID does not exist'
        },
        { status: 404 }
      )
    }

    // Check if department has contracts
    if (department._count.contracts > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete department',
          message: `Cannot delete department because it has ${department._count.contracts} associated contracts`
        },
        { status: 400 }
      )
    }

    // Delete department
    await db.department.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete department',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}