import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClass extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
    {
        name: {
            type: String,
            required: [true, 'اسم الفصل مطلوب'],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Class: Model<IClass> = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);

export default Class;
