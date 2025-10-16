import { NextRequest, NextResponse } from "next/server";
import { createProductType } from "@/app/product-types/actions";

export async function POST(request: NextRequest) {
  try {
    const { id, name, description, icon, color } = await request.json();
    
    if (!name || !icon || !color) {
      return NextResponse.json(
        { error: "Missing required fields: name, icon, color" },
        { status: 400 }
      );
    }

    // Create form data for the createProductType action
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("icon", icon);
    formData.append("color", color);

    const result = await createProductType(formData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in duplicate product type API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
