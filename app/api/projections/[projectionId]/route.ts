import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import { Projection } from "@/lib/models";

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectionId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const { projectionId } = await params;
    const body = await request.json();
    const { name, data, filename, rowCount, columnCount, isOverage } = body;
    if (!name || !data) {
      return NextResponse.json(
        { error: "Name and data are required" },
        { status: 400 }
      );
    }
    // Find the existing projection to get projectId
    const existing = await Projection.findById(projectionId);
    if (!existing) {
      return NextResponse.json(
        { error: "Projection not found" },
        { status: 404 }
      );
    }
    const updated = await Projection.findByIdAndUpdate(
      projectionId,
      {
        projectId: existing.projectId, // ensure projectId is always present
        name,
        data: JSON.stringify(data),
        filename,
        rowCount,
        columnCount,
        isOverage,
      },
      { new: true }
    );
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating projection:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update projection" },
      { status: 500 }
    );
  }
}
