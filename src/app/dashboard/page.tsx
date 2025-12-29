'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';

interface ClassItem {
    _id: string;
    name: string;
    createdAt: string;
}

export default function DashboardPage() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newClassName, setNewClassName] = useState('');
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
    const [editName, setEditName] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch('/api/classes');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setClasses(data);
        } catch {
            toast.error('فشل في تحميل الفصول');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        try {
            const res = await fetch('/api/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClassName.trim() }),
            });

            if (!res.ok) throw new Error('Failed to create');

            const newClass = await res.json();
            setClasses([newClass, ...classes]);
            setNewClassName('');
            setCreateDialogOpen(false);
            toast.success('تم إنشاء الفصل بنجاح');
        } catch {
            toast.error('فشل في إنشاء الفصل');
        }
    };

    const handleEditClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClass || !editName.trim()) return;

        try {
            const res = await fetch(`/api/classes/${editingClass._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim() }),
            });

            if (!res.ok) throw new Error('Failed to update');

            const updatedClass = await res.json();
            setClasses(classes.map((c) => (c._id === updatedClass._id ? updatedClass : c)));
            setEditingClass(null);
            setEditName('');
            setEditDialogOpen(false);
            toast.success('تم تحديث الفصل بنجاح');
        } catch {
            toast.error('فشل في تحديث الفصل');
        }
    };

    const handleDeleteClass = async () => {
        if (!classToDelete) return;

        try {
            const res = await fetch(`/api/classes/${classToDelete._id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete');

            setClasses(classes.filter((c) => c._id !== classToDelete._id));
            setClassToDelete(null);
            setDeleteDialogOpen(false);
            toast.success('تم حذف الفصل بنجاح');
        } catch {
            toast.error('فشل في حذف الفصل');
        }
    };

    const openEditDialog = (classItem: ClassItem) => {
        setEditingClass(classItem);
        setEditName(classItem.name);
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (classItem: ClassItem) => {
        setClassToDelete(classItem);
        setDeleteDialogOpen(true);
    };

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">نظام الدرجات المدرسية</h1>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        + إنشاء فصل
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-gray-500">جارٍ التحميل...</div>
                    </div>
                ) : classes.length === 0 ? (
                    <Card className="bg-white border-dashed border-2 border-gray-300">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
                            <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-lg mb-1">لا توجد فصول</p>
                            <p className="text-sm">اضغط على &quot;إنشاء فصل&quot; للبدء</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((classItem) => (
                            <Card key={classItem._id} className="bg-white hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 text-lg">{classItem.name}</h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(classItem.createdAt).toLocaleDateString('ar-EG')}
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditDialog(classItem)}
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => openDeleteDialog(classItem)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <Link href={`/class/${classItem._id}`}>
                                        <Button className="w-full" variant="outline">
                                            عرض الطلاب والدرجات
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>إنشاء فصل جديد</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                        <div>
                            <Label htmlFor="className">اسم الفصل</Label>
                            <Input
                                id="className"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="مثال: الصف الأول أ"
                                className="mt-2"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={!newClassName.trim()}>
                                إنشاء
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل اسم الفصل</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditClass} className="space-y-4">
                        <div>
                            <Label htmlFor="editClassName">اسم الفصل</Label>
                            <Input
                                id="editClassName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="mt-2"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={!editName.trim()}>
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
                        <p className="text-gray-600">هل أنت متأكد من حذف الفصل &quot;{classToDelete?.name}&quot;؟</p>
                        <p className="text-sm text-red-600 mt-2">سيتم حذف جميع الطلاب والدرجات.</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            إلغاء
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteClass}>
                            حذف
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
