import { cookies } from "next/headers";

export async function getCurrentOrgId(): Promise<number> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('currentOrgId')?.value;
  
  if (orgId) {
    return parseInt(orgId);
  }
  
  // Default to F1 Tour Operator org ID if no org is set
  return 100;
}
