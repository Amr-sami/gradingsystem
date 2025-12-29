import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student, { GRADES_COUNT, MIN_GRADE, MAX_GRADE } from '@/models/Student';
import mongoose from 'mongoose';

interface Params {
    params: Promise<{ id: string }>;
}

// PATCH /api/students/[id] - Update student (name, number, or grades)
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'معرف الطالب غير صالح' },
                { status: 400 }
            );
        }

        await connectDB();
        const body = await request.json();

        const updateData: Record<string, unknown> = {};

        // Validate and set name if provided
        if (body.name !== undefined) {
            if (typeof body.name !== 'string' || body.name.trim() === '') {
                return NextResponse.json(
                    { error: 'اسم الطالب غير صالح' },
                    { status: 400 }
                );
            }
            updateData.name = body.name.trim();
        }

        // Set number if provided
        if (body.number !== undefined) {
            updateData.number = body.number?.trim() || undefined;
        }

        // Validate and set grades if provided
        if (body.grades !== undefined) {
            if (!Array.isArray(body.grades)) {
                return NextResponse.json(
                    { error: 'الدرجات يجب أن تكون مصفوفة' },
                    { status: 400 }
                );
            }

            if (body.grades.length !== GRADES_COUNT) {
                return NextResponse.json(
                    { error: `يجب أن تكون الدرجات ${GRADES_COUNT} درجة` },
                    { status: 400 }
                );
            }

            const validatedGrades = body.grades.map((grade: unknown) => {
                const num = Number(grade);
                if (isNaN(num)) return 0;
                return Math.max(MIN_GRADE, Math.min(MAX_GRADE, num));
            });

            updateData.grades = validatedGrades;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'لا توجد بيانات للتحديث' },
                { status: 400 }
            );
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            return NextResponse.json(
                { error: 'الطالب غير موجود' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json(
            { error: 'فشل في تحديث الطالب' },
            { status: 500 }
        );
    }
}

// DELETE /api/students/[id] - Delete a student
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'معرف الطالب غير صالح' },
                { status: 400 }
            );
        }

        await connectDB();

        const deletedStudent = await Student.findByIdAndDelete(id);

        if (!deletedStudent) {
            return NextResponse.json(
                { error: 'الطالب غير موجود' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'تم حذف الطالب بنجاح' });
    } catch (error) {
        console.error('Error deleting student:', error);
        return NextResponse.json(
            { error: 'فشل في حذف الطالب' },
            { status: 500 }
        );
    }
}
