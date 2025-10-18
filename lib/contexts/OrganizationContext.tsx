"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Organization {
  id: number;
  name: string;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrganizations = async () => {
    try {
      const supabase = createClient();
      
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setOrganizations(orgs || []);
      
      // Get current org from localStorage or use first one
      const savedOrgId = localStorage.getItem('currentOrgId');
      let orgToSet = null;
      
      if (savedOrgId && orgs) {
        orgToSet = orgs.find(org => org.id.toString() === savedOrgId);
      }
      
      if (!orgToSet && orgs && orgs.length > 0) {
        orgToSet = orgs[0];
      }
      
      setCurrentOrgState(orgToSet);
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem('currentOrgId', org.id.toString());
    
    // Also set the cookie for server components
    document.cookie = `currentOrgId=${org.id}; path=/; max-age=31536000`;
  };

  const refreshOrganizations = async () => {
    setIsLoading(true);
    await loadOrganizations();
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        setCurrentOrg,
        refreshOrganizations,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
