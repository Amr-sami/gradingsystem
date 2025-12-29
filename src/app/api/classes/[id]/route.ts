import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Class from '@/models/Class';
import Student from '@/models/Student';
import mongoose from 'mongoose';

interface Params {
    params: Promise<{ id: string }>;
}

// PATCH /api/classes/[id] - Update class name
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'معرف الفصل غير صالح' },
                { status: 400 }
            );
        }

        await connectDB();
        const body = await request.json();

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return NextResponse.json(
                { error: 'اسم الفصل مطلوب' },
                { status: 400 }
            );
        }

        const updatedClass = await Class.findByIdAndUpdate(
            id,
            { name: body.name.trim() },
            { new: true, runValidators: true }
        );

        if (!updatedClass) {
            return NextResponse.json(
                { error: 'الفصل غير موجود' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedClass);
    } catch (error) {
        console.error('Error updating class:', error);
        return NextResponse.json(
            { error: 'فشل في تحديث الفصل' },
            { status: 500 }
        );
    }
}

// DELETE /api/classes/[id] - Delete class and all its students
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'معرف الفصل غير صالح' },
                { status: 400 }
            );
        }

        await connectDB();

        const deletedClass = await Class.findByIdAndDelete(id);

        if (!deletedClass) {
            return NextResponse.json(
                { error: 'الفصل غير موجود' },
                { status: 404 }
            );
        }

        // Delete all students in this class
        await Student.deleteMany({ classId: id });

        return NextResponse.json({ message: 'تم حذف الفصل بنجاح' });
    } catch (error) {
        console.error('Error deleting class:', error);
        return NextResponse.json(
            { error: 'فشل في حذف الفصل' },
            { status: 500 }
        );
    }
}
