import { createClient } from "@/utils/supabase/server";
import { ProductManagementClient } from "@/components/products/ProductManagementClient";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { notFound } from "next/navigation";

export default async function ProductManagementPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id);
  const orgId = 1; // TODO: from session

  if (isNaN(productId)) {
    notFound();
  }

  // Initialize Supabase client
  const supabase = await createClient();

  let product: any = null;
  let variants: any[] = [];
  let suppliers: any[] = [];
  let hasDatabaseError = false;
  
  try {
    // Fetch product with related data
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        product_types(
          id,
          name,
          description,
          icon,
          color
        )
      `)
      .eq('id', productId)
      .eq('org_id', orgId)
      .single();

    if (productError || !productData) {
      notFound();
    }

    product = productData;

    // Fetch variants for this product
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        *,
        rate_plans(
          id,
          inventory_model,
          currency,
          valid_from,
          valid_to,
          preferred,
          channels,
          markets,
          rate_doc,
          suppliers(
            id,
            name
          )
        ),
        allocation_buckets(
          id,
          date,
          allocation_type,
          quantity,
          booked,
          held
        )
      `)
      .eq('product_id', productId)
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      variants = [];
    } else {
      variants = variantsData || [];
    }

    // Fetch all suppliers for editing
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      suppliers = [];
    } else {
      suppliers = suppliersData || [];
    }

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasDatabaseError={hasDatabaseError}
        />
      )}
      
      <ProductManagementClient
        product={product}
        variants={variants}
        suppliers={suppliers}
      />
    </div>
  );
}
