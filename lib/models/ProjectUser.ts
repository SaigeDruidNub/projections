import { Schema, model, models, Types } from "mongoose";

export interface IProjectUser {
  _id: string;
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectUserSchema = new Schema<IProjectUser>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    role: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

ProjectUserSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const ProjectUser =
  models.ProjectUser || model<IProjectUser>("ProjectUser", ProjectUserSchema);
