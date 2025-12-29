# نظام الدرجات المدرسية

نظام ويب لإدارة درجات الطلاب مبني بتقنية Next.js 14 مع MongoDB Atlas.

## المميزات

- ✅ إنشاء وتعديل وحذف الفصول
- ✅ إضافة وتعديل وحذف الطلاب
- ✅ جدول درجات يشبه جداول البيانات (12 تقييم لكل طالب)
- ✅ حساب تلقائي للمجموع والمتوسط
- ✅ حفظ تلقائي مع تأخير 600 مللي ثانية
- ✅ البحث عن الطلاب بالاسم
- ✅ ترتيب حسب الاسم أو المتوسط
- ✅ واجهة عربية RTL
- ✅ صفحة طباعة A4

## التثبيت

### 1. استنساخ المشروع

```bash
cd school-grading-app
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إعداد قاعدة البيانات

أنشئ ملف `.env.local` في المجلد الرئيسي وأضف:

```
MONGODB_URI="mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@gradingapp.2bejywg.mongodb.net/gradingapp?retryWrites=true&w=majority&appName=gradingapp"
```

استبدل `<YOUR_USERNAME>` و `<YOUR_PASSWORD>` ببيانات MongoDB Atlas الخاصة بك.

### 4. تشغيل التطبيق

```bash
npm run dev
```

افتح المتصفح على: http://localhost:3000

## هيكل المشروع

```
src/
├── app/
│   ├── api/
│   │   ├── classes/
│   │   │   ├── route.ts          # GET, POST classes
│   │   │   └── [id]/
│   │   │       └── route.ts      # PATCH, DELETE class
│   │   │       └── [classId]/
│   │   │           └── students/
│   │   │               └── route.ts  # GET, POST students
│   │   └── students/
│   │       └── [id]/
│   │           └── route.ts      # PATCH, DELETE student
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page
│   ├── class/
│   │   └── [classId]/
│   │       └── page.tsx          # Class grades page
│   └── print/
│       └── class/
│           └── [classId]/
│               └── page.tsx      # Print view
├── models/
│   ├── Class.ts                  # Class model
│   └── Student.ts                # Student model
├── lib/
│   ├── mongodb.ts                # MongoDB connection
│   └── utils.ts                  # Utilities
└── components/
    └── ui/                       # shadcn/ui components
```

## التقنيات المستخدمة

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- MongoDB Atlas + Mongoose
- React Hook Form + Zod

## الملاحظات

- الدرجات تتراوح من 0 إلى 10 (يمكن تغييرها في `src/models/Student.ts`)
- عدد التقييمات 12 (يمكن تغييره في `src/models/Student.ts`)
