import { NextRequest, NextResponse } from "next/server";
import { createProductSubtype } from "@/app/product-types/actions";

export async function POST(request: NextRequest) {
  try {
    const { id, name, description, icon, product_type_id } = await request.json();
    
    if (!name || !icon || !product_type_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, icon, product_type_id" },
        { status: 400 }
      );
    }

    // Create form data for the createProductSubtype action
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("icon", icon);
    formData.append("product_type_id", product_type_id.toString());

    const result = await createProductSubtype(formData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Error in duplicate product subtype API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
