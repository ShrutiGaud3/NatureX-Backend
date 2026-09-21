import mongoose, { Document, Schema } from 'mongoose';

export interface ILandPolygon extends Document {
  landId: mongoose.Types.ObjectId;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
  };
  calculatedAreaSqM: number;
  calculatedAcres: number;
  perimeterMeters?: number;
  centroid?: {
    type: 'Point';
    coordinates: number[]; // [lng, lat]
  };
  isSelfIntersecting: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const LandPolygonSchema = new Schema<ILandPolygon>(
  {
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, index: true },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true
      },
      coordinates: {
        type: [[[Number]]],
        required: true
      }
    },
    calculatedAreaSqM: { type: Number, required: true },
    calculatedAcres: { type: Number, required: true },
    perimeterMeters: { type: Number },
    centroid: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number]
    },
    isSelfIntersecting: { type: Boolean, default: false },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

LandPolygonSchema.index({ geometry: '2dsphere' });

export const LandPolygon = mongoose.model<ILandPolygon>('LandPolygon', LandPolygonSchema);
