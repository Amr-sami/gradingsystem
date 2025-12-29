import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Class from '@/models/Class';

// GET /api/classes - List all classes
export async function GET() {
    try {
        await connectDB();
        const classes = await Class.find().sort({ createdAt: -1 });
        return NextResponse.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        return NextResponse.json(
            { error: 'فشل في جلب الفصول' },
            { status: 500 }
        );
    }
}

// POST /api/classes - Create a new class
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const body = await request.json();

        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return NextResponse.json(
                { error: 'اسم الفصل مطلوب' },
                { status: 400 }
            );
        }

        const newClass = await Class.create({ name: body.name.trim() });
        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        console.error('Error creating class:', error);
        return NextResponse.json(
            { error: 'فشل في إنشاء الفصل' },
            { status: 500 }
        );
    }
}
