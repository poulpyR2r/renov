import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type AgencyRole = "AGENCY_ADMIN" | "AGENCY_MANAGER" | "AGENCY_USER" | null;

export function useAgencyRole(): AgencyRole {
  const { data: session, status } = useSession();
  const [agencyRole, setAgencyRole] = useState<AgencyRole>(null);

  useEffect(() => {
    if (status === "loading" || !session?.user) {
      setAgencyRole(null);
      return;
    }

    if (session.user.role !== "agency") {
      setAgencyRole(null);
      return;
    }

    const fetchRole = async () => {
      try {
        const agencyRes = await fetch("/api/agency/me");
        const agencyData = await agencyRes.json();

        if (agencyData.success && agencyData.role) {
          setAgencyRole(agencyData.role);
        }
      } catch (error) {
        console.error("Error fetching agency role:", error);
        setAgencyRole(null);
      }
    };

    fetchRole();
  }, [session, status]);

  return agencyRole;
}

