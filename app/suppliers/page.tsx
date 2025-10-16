import { createClient } from "@/utils/supabase/server";
import { deleteSupplier } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Globe, CheckCircle2, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { SupplierSheet } from "@/components/suppliers/SupplierSheet";
import { SuppliersPageClient } from "@/components/suppliers/SuppliersPageClient";
import { SuppliersSearch } from "@/components/suppliers/SuppliersSearch";
import { ClearSearchButton } from "@/components/suppliers/ClearSearchButton";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { format } from "date-fns";

export default async function SuppliersPage({ searchParams }: { searchParams?: Promise<{ q?: string; page?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const orgId = 1; // TODO: from session
  const q = (resolvedSearchParams?.q ?? "").trim();
  const page = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1")); // Ensure page is at least 1
  const limit = 20; // Increased from 10 for better UX with large datasets
  const offset = (page - 1) * limit;

  // Initialize Supabase client
  const supabase = await createClient();

  // Execute queries with Supabase
  let suppliers: any[] = [], totalCount = 0, activeCount = 0, hasDatabaseError = false;
  
  try {
    // Build search filter
    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Add search conditions
    if (q) {
      query = query.or(`name.ilike.%${q}%,status.ilike.%${q}%`);
    }

    // Get total count
    const { count, error: countError } = await query;
    if (countError) throw countError;
    totalCount = count || 0;

    // Get suppliers with pagination
    const { data: suppliersData, error: suppliersError } = await query
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (suppliersError) throw suppliersError;
    suppliers = suppliersData || [];

    // Get active count
    let activeQuery = supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (q) {
      activeQuery = activeQuery.or(`name.ilike.%${q}%,status.ilike.%${q}%`);
    }

    const { count: activeCountResult, error: activeError } = await activeQuery;
    if (activeError) throw activeError;
    activeCount = activeCountResult || 0;

  } catch (error) {
    console.error("Database connection error:", error);

    // Return empty data when database is not available
    hasDatabaseError = true;
    suppliers = [];
    totalCount = 0;
    activeCount = 0;
  }

  // Calculate stats (optimized - no need to filter client-side)
  const totalChannels = [...new Set(suppliers.flatMap(s => s.channels || []))].length;
  const totalPages = Math.ceil(totalCount / limit);
  
  // Calculate new suppliers this month (only from current page for performance)
  const newThisMonth = suppliers.filter(s => {
    const createdDate = new Date(s.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <TooltipProvider>
    <div className="space-y-4">
        {hasDatabaseError && (
          <DatabaseStatus 
            hasError={hasDatabaseError}
          />
        )}
        
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount.toLocaleString()} total • {activeCount.toLocaleString()} active
            </p>
          </div>
        <div className="flex items-center gap-2">
          <SuppliersSearch />
          <SupplierSheet
              trigger={
                <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              }
          />
        </div>
      </div>

        {/* Information Card */}
        {!q && (
          <Card className="border-primary bg-primary/10 dark:border-primary dark:bg-primary/10">
            <CardContent className="">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary dark:text-primary mt-0.5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-primary dark:text-primary">Manage Your Supplier Network</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    Suppliers are your business partners who provide products and services to your customers. 
                    Here you can add hotels, tour operators, transportation companies, activity providers, and other vendors 
                    that you work with to deliver exceptional travel experiences.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Track contact information
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3 text-primary" />
                      Manage distribution channels
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      Monitor supplier status
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results Info */}
        {q && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hasDatabaseError ? (
                "Database connection error - search unavailable"
              ) : totalCount === 0 ? (
                <>No suppliers found for "<span className="font-medium">{q}</span>"</>
              ) : (
                <>
                  {totalCount} supplier{totalCount !== 1 ? 's' : ''} found for "<span className="font-medium">{q}</span>"
                </>
              )}
            </p>
            {totalCount > 0 && !hasDatabaseError && <ClearSearchButton />}
          </div>
        )}

        {/* Suppliers Table with Bulk Actions */}
        <SuppliersPageClient suppliers={suppliers}>
          {/* Compact Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + limit, totalCount).toLocaleString()} of {totalCount.toLocaleString()} suppliers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <a href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Previous
                  </a>
                ) : (
                  <>
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Previous
                  </>
                )}
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <a href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        
        
        </SuppliersPageClient>
      </div>
    </TooltipProvider>
  );
}


