'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

    // Fetch classes on mount
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
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            نظام الدرجات المدرسية
                        </h1>
                        <p className="text-white/80">إدارة الفصول والطلاب والدرجات</p>
                    </div>

                    {/* Create Class Dialog */}
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-bold shadow-lg">
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                إنشاء فصل جديد
                            </Button>
                        </DialogTrigger>
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
                </div>

                {/* Classes Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-white text-xl">جارٍ التحميل...</div>
                    </div>
                ) : classes.length === 0 ? (
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-white">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p className="text-xl mb-2">لا توجد فصول بعد</p>
                            <p className="opacity-70">اضغط على زر &quot;إنشاء فصل جديد&quot; للبدء</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((classItem) => (
                            <Card
                                key={classItem._id}
                                className="bg-white/95 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl text-gray-800">{classItem.name}</CardTitle>
                                    <p className="text-sm text-gray-500">
                                        {new Date(classItem.createdAt).toLocaleDateString('ar-EG', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex gap-2">
                                        <Link href={`/class/${classItem._id}`} className="flex-1">
                                            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                                عرض الطلاب
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => openEditDialog(classItem)}
                                            className="shrink-0"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => openDeleteDialog(classItem)}
                                            className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

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

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>تأكيد الحذف</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p>هل أنت متأكد من حذف الفصل &quot;{classToDelete?.name}&quot;؟</p>
                            <p className="text-sm text-red-600 mt-2">سيتم حذف جميع الطلاب والدرجات في هذا الفصل.</p>
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
        </div>
    );
}
