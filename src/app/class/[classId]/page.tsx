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
const MAX_GRADE = 10;

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

    // Add student dialog
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentNumber, setNewStudentNumber] = useState('');

    // Edit student dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editStudentName, setEditStudentName] = useState('');
    const [editStudentNumber, setEditStudentNumber] = useState('');

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    // Debounce timers
    const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Fetch class and students
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
            } catch {
                toast.error('فشل في تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [classId]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            debounceTimers.current.forEach((timer) => clearTimeout(timer));
        };
    }, []);

    // Calculate total and average for a student
    const calculateTotalAndAverage = (grades: number[]) => {
        const total = grades.reduce((sum, grade) => sum + grade, 0);
        const average = total / GRADES_COUNT;
        return { total, average };
    };

    // Save grades to server
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

            // Clear saved status after 2 seconds
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

    // Handle grade change with debounce
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

        // Clear existing timer
        const existingTimer = debounceTimers.current.get(studentId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new debounce timer
        const timer = setTimeout(() => {
            const student = students.find((s) => s._id === studentId);
            if (student) {
                const updatedStudent = { ...student };
                updatedStudent.grades = [...updatedStudent.grades];
                updatedStudent.grades[gradeIndex] = numValue;
                saveGrades(studentId, updatedStudent.grades);
            } else {
                // Get current grades from state
                setStudents((currentStudents) => {
                    const s = currentStudents.find((st) => st._id === studentId);
                    if (s) {
                        saveGrades(studentId, s.grades);
                    }
                    return currentStudents;
                });
            }
        }, 600);

        debounceTimers.current.set(studentId, timer);
    };

    // Add student
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
            toast.success('تم إضافة الطالب بنجاح');
        } catch {
            toast.error('فشل في إضافة الطالب');
        }
    };

    // Edit student
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

            if (!res.ok) throw new Error('Failed to update student');

            const updatedStudent = await res.json();
            setStudents((prev) =>
                prev.map((s) => (s._id === updatedStudent._id ? updatedStudent : s))
            );
            setEditingStudent(null);
            setEditDialogOpen(false);
            toast.success('تم تحديث الطالب بنجاح');
        } catch {
            toast.error('فشل في تحديث الطالب');
        }
    };

    // Delete student
    const handleDeleteStudent = async () => {
        if (!studentToDelete) return;

        try {
            const res = await fetch(`/api/students/${studentToDelete._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete student');

            setStudents((prev) => prev.filter((s) => s._id !== studentToDelete._id));
            setStudentToDelete(null);
            setDeleteDialogOpen(false);
            toast.success('تم حذف الطالب بنجاح');
        } catch {
            toast.error('فشل في حذف الطالب');
        }
    };

    // Open edit dialog
    const openEditDialog = (student: Student) => {
        setEditingStudent(student);
        setEditStudentName(student.name);
        setEditStudentNumber(student.number || '');
        setEditDialogOpen(true);
    };

    // Open delete dialog
    const openDeleteDialog = (student: Student) => {
        setStudentToDelete(student);
        setDeleteDialogOpen(true);
    };

    // Toggle sort
    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Filter and sort students
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
                <div className="text-white text-xl">جارٍ التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-full mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                {classInfo?.name || 'الفصل'}
                            </h1>
                            <p className="text-white/80 text-sm">
                                {students.length} طالب
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <Input
                            placeholder="بحث عن طالب..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-xs bg-white/95"
                        />

                        <div className="flex gap-2">
                            <Button
                                variant={sortField === 'name' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleSort('name')}
                                className={sortField === 'name' ? '' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'}
                            >
                                ترتيب بالاسم
                                {sortField === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                            </Button>
                            <Button
                                variant={sortField === 'average' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleSort('average')}
                                className={sortField === 'average' ? '' : 'bg-white/20 border-white/30 text-white hover:bg-white/30'}
                            >
                                ترتيب بالمتوسط
                                {sortField === 'average' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                            </Button>
                        </div>

                        <Button
                            onClick={() => setAddDialogOpen(true)}
                            className="bg-white text-purple-700 hover:bg-white/90 font-bold"
                        >
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            إضافة طالب
                        </Button>

                        <Link href={`/print/class/${classId}`} target="_blank">
                            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                طباعة
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Grades Table */}
                <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle>جدول الدرجات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p className="text-lg">لا يوجد طلاب في هذا الفصل</p>
                                <p className="text-sm mt-1">اضغط على &quot;إضافة طالب&quot; للبدء</p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="sticky right-0 bg-white z-10 min-w-[150px]">اسم الطالب</TableHead>
                                            <TableHead className="min-w-[80px]">الرقم</TableHead>
                                            {Array.from({ length: GRADES_COUNT }, (_, i) => (
                                                <TableHead key={i} className="text-center min-w-[60px]">
                                                    تقييم {i + 1}
                                                </TableHead>
                                            ))}
                                            <TableHead className="text-center min-w-[80px] bg-green-50">المجموع</TableHead>
                                            <TableHead className="text-center min-w-[80px] bg-blue-50">المتوسط</TableHead>
                                            <TableHead className="min-w-[100px]">الحالة</TableHead>
                                            <TableHead className="min-w-[100px]">إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndSortedStudents.map((student) => (
                                            <TableRow key={student._id}>
                                                <TableCell className="font-medium sticky right-0 bg-white z-10">
                                                    {student.name}
                                                </TableCell>
                                                <TableCell className="text-gray-500">
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
                                                            className="grade-input w-12 bg-gray-50"
                                                        />
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-center font-bold bg-green-50">
                                                    {student.total}
                                                </TableCell>
                                                <TableCell className="text-center font-bold bg-blue-50">
                                                    {student.average.toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    {savingStudents.has(student._id) ? (
                                                        <span className="save-status bg-yellow-100 text-yellow-800">
                                                            جارٍ الحفظ...
                                                        </span>
                                                    ) : savedStudents.has(student._id) ? (
                                                        <span className="save-status bg-green-100 text-green-800">
                                                            تم الحفظ ✓
                                                        </span>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(student)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openDeleteDialog(student)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </Button>
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

                {/* Add Student Dialog */}
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة طالب جديد</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <Label htmlFor="studentName">اسم الطالب *</Label>
                                <Input
                                    id="studentName"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    placeholder="مثال: أحمد محمد"
                                    className="mt-2"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label htmlFor="studentNumber">رقم الطالب (اختياري)</Label>
                                <Input
                                    id="studentNumber"
                                    value={newStudentNumber}
                                    onChange={(e) => setNewStudentNumber(e.target.value)}
                                    placeholder="مثال: 123"
                                    className="mt-2"
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
                            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditStudent} className="space-y-4">
                            <div>
                                <Label htmlFor="editStudentName">اسم الطالب *</Label>
                                <Input
                                    id="editStudentName"
                                    value={editStudentName}
                                    onChange={(e) => setEditStudentName(e.target.value)}
                                    className="mt-2"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <Label htmlFor="editStudentNumber">رقم الطالب (اختياري)</Label>
                                <Input
                                    id="editStudentNumber"
                                    value={editStudentNumber}
                                    onChange={(e) => setEditStudentNumber(e.target.value)}
                                    className="mt-2"
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

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>تأكيد الحذف</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p>هل أنت متأكد من حذف الطالب &quot;{studentToDelete?.name}&quot;؟</p>
                            <p className="text-sm text-red-600 mt-2">سيتم حذف جميع درجات هذا الطالب.</p>
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
        </div>
    );
}
