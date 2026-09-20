import { NextResponse } from "next/server";
import { db } from "@/db";
import { collaborations } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      projectId?: number;
      roleId?: number;
      fullName?: string;
      email?: string;
      message?: string;
      portfolioUrl?: string;
      skills?: string[];
    };

    if (!body.projectId || !body.fullName || !body.email) {
      return NextResponse.json(
        { error: "projectId, fullName and email are required" },
        { status: 400 }
      );
    }

    const [application] = await db
      .insert(collaborations)
      .values({
        projectId: body.projectId,
        roleId: body.roleId,
        fullName: body.fullName,
        email: body.email,
        message: body.message,
        portfolioUrl: body.portfolioUrl,
        skills: body.skills || [],
      })
      .returning();

    return NextResponse.json({ success: true, id: application.id });
  } catch (error) {
    console.error("Collaboration route error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
