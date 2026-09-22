import mongoose, { Document, Schema } from 'mongoose';

export interface IOverlappingLandInfo {
  landId: mongoose.Types.ObjectId;
  landName?: string;
  surveyNumber?: string;
}

export interface ILandPolygon extends Document {
  landId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
  };
  calculatedAreaSqM: number;
  calculatedAcres: number;
  calculatedHectares: number;
  perimeterMeters: number;
  centroid: {
    type: 'Point';
    coordinates: number[]; // [lng, lat]
  };
  bbox?: number[]; // [minLng, minLat, maxLng, maxLat]
  isSelfIntersecting: boolean;
  overlapStatus: 'clean' | 'overlap_detected';
  overlappingLands: IOverlappingLandInfo[];
  mappingMethod: 'gps_walk' | 'manual_pin' | 'kml_import' | 'shapefile_import';
  gpsAccuracyMeters?: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const OverlappingLandInfoSchema = new Schema<IOverlappingLandInfo>(
  {
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true },
    landName: { type: String },
    surveyNumber: { type: String }
  },
  { _id: false }
);

const LandPolygonSchema = new Schema<ILandPolygon>(
  {
    landId: { type: Schema.Types.ObjectId, ref: 'Land', required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
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
    calculatedHectares: { type: Number, required: true },
    perimeterMeters: { type: Number, required: true, default: 0 },
    centroid: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    },
    bbox: { type: [Number] },
    isSelfIntersecting: { type: Boolean, default: false },
    overlapStatus: {
      type: String,
      enum: ['clean', 'overlap_detected'],
      default: 'clean',
      index: true
    },
    overlappingLands: [OverlappingLandInfoSchema],
    mappingMethod: {
      type: String,
      enum: ['gps_walk', 'manual_pin', 'kml_import', 'shapefile_import'],
      default: 'manual_pin'
    },
    gpsAccuracyMeters: { type: Number },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

LandPolygonSchema.index({ geometry: '2dsphere' });
LandPolygonSchema.index({ centroid: '2dsphere' });

export const LandPolygon = mongoose.model<ILandPolygon>('LandPolygon', LandPolygonSchema);

