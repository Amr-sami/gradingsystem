import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Student, { GRADES_COUNT } from '@/models/Student';
import Class from '@/models/Class';
import mongoose from 'mongoose';

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/classes/[id]/students - Get all students in a class
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'معرف الفصل غير صالح' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if class exists
        const classExists = await Class.findById(id);
        if (!classExists) {
            return NextResponse.json(
                { error: 'الفصل غير موجود' },
                { status: 404 }
            );
        }

        const students = await Student.find({ classId: id }).sort({ createdAt: 1 });
        return NextResponse.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { error: 'فشل في جلب الطلاب' },
            { status: 500 }
        );
    }
}

// POST /api/classes/[id]/students - Add a new student
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'معرف الفصل غير صالح' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if class exists
        const classExists = await Class.findById(id);
        if (!classExists) {
            return NextResponse.json(
                { error: 'الفصل غير موجود' },
                { status: 404 }
            );
        }

        const body = await request.json();

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return NextResponse.json(
                { error: 'اسم الطالب مطلوب' },
                { status: 400 }
            );
        }

        const newStudent = await Student.create({
            classId: id,
            name: body.name.trim(),
            number: body.number?.trim() || undefined,
            grades: Array(GRADES_COUNT).fill(0),
        });

        return NextResponse.json(newStudent, { status: 201 });
    } catch (error) {
        console.error('Error creating student:', error);
        return NextResponse.json(
            { error: 'فشل في إضافة الطالب' },
            { status: 500 }
        );
    }
}
