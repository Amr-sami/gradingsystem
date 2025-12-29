'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { toast } from 'sonner';

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
const MIN_GRADE = 0;
const MAX_GRADE = 20;

type SortField = 'name' | 'average';
type SortOrder = 'asc' | 'desc';

export default function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
    const resolvedParams = use(params);
    const classId = resolvedParams.classId;

    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [savingStudents, setSavingStudents] = useState<Set<string>>(new Set());
    const [savedStudents, setSavedStudents] = useState<Set<string>>(new Set());

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentNumber, setNewStudentNumber] = useState('');

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editStudentName, setEditStudentName] = useState('');
    const [editStudentNumber, setEditStudentNumber] = useState('');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const classRes = await fetch('/api/classes');
                if (!classRes.ok) throw new Error('Failed to fetch classes');
                const classes = await classRes.json();
                const currentClass = classes.find((c: ClassInfo) => c._id === classId);
                if (currentClass) setClassInfo(currentClass);

                const studentsRes = await fetch(`/api/classes/${classId}/students`);
                if (!studentsRes.ok) throw new Error('Failed to fetch students');
                const studentsData = await studentsRes.json();
                setStudents(studentsData);
            } catch {
                toast.error('فشل في تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [classId]);

    useEffect(() => {
        return () => {
            debounceTimers.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    const calculateTotalAndAverage = (grades: number[]) => {
        const total = grades.reduce((sum, grade) => sum + grade, 0);
        const average = total / GRADES_COUNT;
        return { total, average };
    };

    const saveGrades = useCallback(async (studentId: string, grades: number[]) => {
        setSavingStudents((prev) => new Set(prev).add(studentId));
        setSavedStudents((prev) => {
            const newSet = new Set(prev);
            newSet.delete(studentId);
            return newSet;
        });

        try {
            const res = await fetch(`/api/students/${studentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grades }),
            });

            if (!res.ok) throw new Error('Failed to save');

            setSavedStudents((prev) => new Set(prev).add(studentId));
            setTimeout(() => {
                setSavedStudents((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(studentId);
                    return newSet;
                });
            }, 2000);
        } catch {
            toast.error('فشل في حفظ الدرجات');
        } finally {
            setSavingStudents((prev) => {
                const newSet = new Set(prev);
                newSet.delete(studentId);
                return newSet;
            });
        }
    }, []);

    const handleGradeChange = (studentId: string, gradeIndex: number, value: string) => {
        let numValue = parseInt(value) || 0;
        numValue = Math.max(MIN_GRADE, Math.min(MAX_GRADE, numValue));

        setStudents((prev) =>
            prev.map((student) => {
                if (student._id !== studentId) return student;
                const newGrades = [...student.grades];
                newGrades[gradeIndex] = numValue;
                const { total, average } = calculateTotalAndAverage(newGrades);
                return { ...student, grades: newGrades, total, average };
            })
        );

        const existingTimer = debounceTimers.current.get(studentId);
        if (existingTimer) clearTimeout(existingTimer);

        const timer = setTimeout(() => {
            setStudents((currentStudents) => {
                const s = currentStudents.find((st) => st._id === studentId);
                if (s) saveGrades(studentId, s.grades);
                return currentStudents;
            });
        }, 600);

        debounceTimers.current.set(studentId, timer);
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentName.trim()) return;

        try {
            const res = await fetch(`/api/classes/${classId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newStudentName.trim(),
                    number: newStudentNumber.trim() || undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to add student');

            const newStudent = await res.json();
            setStudents((prev) => [...prev, newStudent]);
            setNewStudentName('');
            setNewStudentNumber('');
            setAddDialogOpen(false);
            toast.success('تم إضافة الطالب');
        } catch {
            toast.error('فشل في إضافة الطالب');
        }
    };

    const handleEditStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStudent || !editStudentName.trim()) return;

        try {
            const res = await fetch(`/api/students/${editingStudent._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editStudentName.trim(),
                    number: editStudentNumber.trim() || undefined,
                }),
            });

            if (!res.ok) throw new Error('Failed to update');

            const updatedStudent = await res.json();
            setStudents((prev) =>
                prev.map((s) => (s._id === updatedStudent._id ? updatedStudent : s))
            );
            setEditDialogOpen(false);
            toast.success('تم تحديث الطالب');
        } catch {
            toast.error('فشل في تحديث الطالب');
        }
    };

    const handleDeleteStudent = async () => {
        if (!studentToDelete) return;

        try {
            const res = await fetch(`/api/students/${studentToDelete._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            setStudents((prev) => prev.filter((s) => s._id !== studentToDelete._id));
            setDeleteDialogOpen(false);
            toast.success('تم حذف الطالب');
        } catch {
            toast.error('فشل في حذف الطالب');
        }
    };

    const openEditDialog = (student: Student) => {
        setEditingStudent(student);
        setEditStudentName(student.name);
        setEditStudentNumber(student.number || '');
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (student: Student) => {
        setStudentToDelete(student);
        setDeleteDialogOpen(true);
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedStudents = students
        .filter((student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            if (sortField === 'name') {
                return a.name.localeCompare(b.name, 'ar') * multiplier;
            } else {
                return (a.average - b.average) * multiplier;
            }
        });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">جارٍ التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-full mx-auto px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    → العودة
                                </Button>
                            </Link>
                            <div className="border-r border-gray-200 h-6 hidden sm:block"></div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">{classInfo?.name || 'الفصل'}</h1>
                                <p className="text-xs text-gray-500">{students.length} طالب</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Input
                                placeholder="بحث..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-40"
                            />
                            <Button variant="outline" size="sm" onClick={() => toggleSort('name')}>
                                الاسم {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleSort('average')}>
                                المتوسط {sortField === 'average' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </Button>
                            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                                + إضافة طالب
                            </Button>
                            <Link href={`/print/class/${classId}`} target="_blank">
                                <Button variant="outline" size="sm">طباعة</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                <Card className="bg-white">
                    <CardHeader className="py-3 border-b">
                        <CardTitle className="text-base">جدول الدرجات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {students.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <p className="text-lg mb-1">لا يوجد طلاب</p>
                                <p className="text-sm">اضغط &quot;إضافة طالب&quot; للبدء</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="sticky right-0 bg-gray-50 z-10 font-semibold">الطالب</TableHead>
                                            <TableHead className="text-center">الرقم</TableHead>
                                            {Array.from({ length: GRADES_COUNT }, (_, i) => (
                                                <TableHead key={i} className="text-center text-xs font-medium">
                                                    ت{i + 1}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-center font-semibold bg-green-50">المجموع</TableHead>
                                            <TableHead className="text-center font-semibold bg-blue-50">المتوسط</TableHead>
                                            <TableHead className="text-center">الحالة</TableHead>
                                            <TableHead className="text-center">-</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndSortedStudents.map((student) => (
                                            <TableRow key={student._id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium sticky right-0 bg-white z-10">
                                                    {student.name}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-400 text-sm">
                                                    {student.number || '-'}
                                                </TableCell>
                                                {student.grades.map((grade, index) => (
                                                    <TableCell key={index} className="p-1">
                                                        <input
                                                            type="number"
                                                            min={MIN_GRADE}
                                                            max={MAX_GRADE}
                                                            value={grade}
                                                            onChange={(e) => handleGradeChange(student._id, index, e.target.value)}
                                                            className="grade-input"
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center font-bold bg-green-50 text-green-700">
                                                    {student.total}
                                                </TableCell>
                                                <TableCell className="text-center font-bold bg-blue-50 text-blue-700">
                                                    {student.average.toFixed(1)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {savingStudents.has(student._id) ? (
                                                        <span className="save-status bg-yellow-100 text-yellow-700">جارٍ...</span>
                                                    ) : savedStudents.has(student._id) ? (
                                                        <span className="save-status bg-green-100 text-green-700">✓</span>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            onClick={() => openEditDialog(student)}
                                                            className="p-1 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteDialog(student)}
                                                            className="p-1 text-gray-400 hover:text-red-600"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Add Student Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إضافة طالب</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <div>
                            <Label htmlFor="studentName">الاسم</Label>
                            <Input
                                id="studentName"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="اسم الطالب"
                                className="mt-1"
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label htmlFor="studentNumber">الرقم (اختياري)</Label>
                            <Input
                                id="studentNumber"
                                value={newStudentNumber}
                                onChange={(e) => setNewStudentNumber(e.target.value)}
                                placeholder="رقم الطالب"
                                className="mt-1"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={!newStudentName.trim()}>
                                إضافة
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Student Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل الطالب</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditStudent} className="space-y-4">
                        <div>
                            <Label htmlFor="editStudentName">الاسم</Label>
                            <Input
                                id="editStudentName"
                                value={editStudentName}
                                onChange={(e) => setEditStudentName(e.target.value)}
                                className="mt-1"
                                autoFocus
                            />
                        </div>
                        <div>
                            <Label htmlFor="editStudentNumber">الرقم</Label>
                            <Input
                                id="editStudentNumber"
                                value={editStudentNumber}
                                onChange={(e) => setEditStudentNumber(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={!editStudentName.trim()}>
                                حفظ
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تأكيد الحذف</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">حذف الطالب &quot;{studentToDelete?.name}&quot;؟</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            إلغاء
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteStudent}>
                            حذف
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
