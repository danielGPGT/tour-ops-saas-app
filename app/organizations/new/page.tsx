import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { OrganizationForm } from "@/components/organizations/OrganizationForm";

export default async function NewOrganizationPage() {
  const supabase = await createClient();

  async function createOrganization(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const currency = formData.get("currency") as string;
    const timezone = formData.get("timezone") as string;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name,
          settings: {
            currency,
            timezone
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Redirect to the new organization
      redirect(`/?org=${data.id}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create New Organization</h1>
        <p className="text-muted-foreground">
          Set up a new organization to manage your tour operations.
        </p>
      </div>

      <OrganizationForm action={createOrganization} />
    </div>
  );
}
