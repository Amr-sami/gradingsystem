'use client';

import { useState, useEffect, use } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Student {
    _id: string;
    name: string;
    number?: string;
    grades: number[];
    total: number;
    average: number;
}

interface ClassInfo {
    _id: string;
    name: string;
}

const GRADES_COUNT = 12;

export default function PrintClassPage({ params }: { params: Promise<{ classId: string }> }) {
    const resolvedParams = use(params);
    const classId = resolvedParams.classId;

    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch class info
                const classRes = await fetch('/api/classes');
                if (!classRes.ok) throw new Error('Failed to fetch classes');
                const classes = await classRes.json();
                const currentClass = classes.find((c: ClassInfo) => c._id === classId);
                if (currentClass) {
                    setClassInfo(currentClass);
                }

                // Fetch students
                const studentsRes = await fetch(`/api/classes/${classId}/students`);
                if (!studentsRes.ok) throw new Error('Failed to fetch students');
                const studentsData = await studentsRes.json();
                setStudents(studentsData);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId]);

    // Sort students by name
    const sortedStudents = [...students].sort((a, b) =>
        a.name.localeCompare(b.name, 'ar')
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-gray-800 text-xl">جارٍ التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-8">
            {/* Header - hidden on print */}
            <div className="no-print mb-6 flex items-center justify-between">
                <Link href={`/class/${classId}`}>
                    <Button variant="outline">
                        العودة للفصل
                    </Button>
                </Link>
                <Button onClick={() => window.print()}>
                    طباعة
                </Button>
            </div>

            {/* Print Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">جدول درجات الطلاب</h1>
                <h2 className="text-xl">{classInfo?.name || 'الفصل'}</h2>
                <p className="text-gray-500 mt-2">
                    عدد الطلاب: {students.length}
                </p>
                <p className="text-gray-500">
                    تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
            </div>

            {/* Grades Table */}
            <div className="overflow-x-auto">
                <Table className="text-sm border-collapse">
                    <TableHeader>
                        <TableRow className="bg-gray-100">
                            <TableHead className="border border-gray-300 text-center font-bold">#</TableHead>
                            <TableHead className="border border-gray-300 font-bold">اسم الطالب</TableHead>
                            <TableHead className="border border-gray-300 text-center">الرقم</TableHead>
                            {Array.from({ length: GRADES_COUNT }, (_, i) => (
                                <TableHead key={i} className="border border-gray-300 text-center text-xs">
                                    ت{i + 1}
                                </TableHead>
                            ))}
                            <TableHead className="border border-gray-300 text-center font-bold bg-green-100">المجموع</TableHead>
                            <TableHead className="border border-gray-300 text-center font-bold bg-blue-100">المتوسط</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStudents.map((student, index) => (
                            <TableRow key={student._id}>
                                <TableCell className="border border-gray-300 text-center">
                                    {index + 1}
                                </TableCell>
                                <TableCell className="border border-gray-300 font-medium">
                                    {student.name}
                                </TableCell>
                                <TableCell className="border border-gray-300 text-center text-gray-500">
                                    {student.number || '-'}
                                </TableCell>
                                {student.grades.map((grade, gradeIndex) => (
                                    <TableCell key={gradeIndex} className="border border-gray-300 text-center">
                                        {grade}
                                    </TableCell>
                                ))}
                                <TableCell className="border border-gray-300 text-center font-bold bg-green-50">
                                    {student.total}
                                </TableCell>
                                <TableCell className="border border-gray-300 text-center font-bold bg-blue-50">
                                    {student.average.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
                نظام الدرجات المدرسية
            </div>
        </div>
    );
}
