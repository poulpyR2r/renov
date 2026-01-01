import { stripe } from "./stripe-config";
import { getAgencyModel } from "@/models/Agency";
import { ObjectId } from "mongodb";

/**
 * Crée ou récupère un Stripe Customer pour une agence
 */
export async function getOrCreateStripeCustomer(
  agencyId: string,
  email: string,
  name?: string
): Promise<string> {
  const Agency = await getAgencyModel();
  const agency = await Agency.findOne({ _id: new ObjectId(agencyId) });

  if (!agency) {
    throw new Error("Agence non trouvée");
  }

  // Si le customer existe déjà, le retourner
  if (agency.stripeCustomerId) {
    try {
      // Vérifier que le customer existe toujours dans Stripe
      await stripe.customers.retrieve(agency.stripeCustomerId);
      return agency.stripeCustomerId;
    } catch (error) {
      // Le customer n'existe plus dans Stripe, on en crée un nouveau
      console.warn(`Stripe customer ${agency.stripeCustomerId} not found, creating new one`);
    }
  }

  // Créer un nouveau customer Stripe
  const customer = await stripe.customers.create({
    email,
    name: name || agency.companyName,
    metadata: {
      agencyId: agencyId,
      companyName: agency.companyName,
    },
  });

  // Sauvegarder l'ID du customer dans la DB
  await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    {
      $set: {
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      },
    }
  );

  return customer.id;
}
