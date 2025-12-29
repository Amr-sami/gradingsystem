import mongoose, { Schema, Document, Model } from 'mongoose';

// Constants - easy to change
export const GRADES_COUNT = 12;
export const MIN_GRADE = 0;
export const MAX_GRADE = 10;

export interface IStudent extends Document {
    _id: mongoose.Types.ObjectId;
    classId: mongoose.Types.ObjectId;
    name: string;
    number?: string;
    grades: number[];
    createdAt: Date;
    updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
    {
        classId: {
            type: Schema.Types.ObjectId,
            ref: 'Class',
            required: [true, 'معرف الفصل مطلوب'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'اسم الطالب مطلوب'],
            trim: true,
        },
        number: {
            type: String,
            trim: true,
        },
        grades: {
            type: [Number],
            default: () => Array(GRADES_COUNT).fill(0),
            validate: {
                validator: function (v: number[]) {
                    return (
                        v.length === GRADES_COUNT &&
                        v.every((grade) => grade >= MIN_GRADE && grade <= MAX_GRADE)
                    );
                },
                message: `يجب أن تكون الدرجات ${GRADES_COUNT} درجة بين ${MIN_GRADE} و ${MAX_GRADE}`,
            },
        },
    },
    {
        timestamps: true,
    }
);

// Virtual for total
StudentSchema.virtual('total').get(function () {
    return this.grades.reduce((sum: number, grade: number) => sum + grade, 0);
});

// Virtual for average
StudentSchema.virtual('average').get(function () {
    const total = this.grades.reduce((sum: number, grade: number) => sum + grade, 0);
    return total / GRADES_COUNT;
});

// Ensure virtuals are included in JSON
StudentSchema.set('toJSON', { virtuals: true });
StudentSchema.set('toObject', { virtuals: true });

const Student: Model<IStudent> =
    mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
