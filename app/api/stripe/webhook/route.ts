import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-config";
import { getAgencyModel } from "@/models/Agency";
import { createCpcTransaction } from "@/models/CpcTransaction";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { PackType, getPackConfig } from "@/lib/packs";

// ⚠️ IMPORTANT : Stripe a besoin du raw body pour vérifier la signature
// Dans Next.js App Router, on doit désactiver le body parsing
export const runtime = "nodejs";

// Désactiver le parsing automatique du body (Next.js 14+)
// Alternative : utiliser request.arrayBuffer() ou request.text()
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  try {
    // Obtenir le raw body comme Buffer
    // Note: request.text() retourne une string, mais Stripe peut aussi accepter une string
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Vérifier la signature du webhook
    // stripe.webhooks.constructEvent accepte string ou Buffer
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    const Agency = await getAgencyModel();

    // Gérer les différents types d'événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          // Paiement CPC (one-time)
          await handleCpcPayment(session, Agency);
        } else if (session.mode === "subscription") {
          // Nouvelle souscription
          await handleSubscriptionCreated(session, Agency);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreatedFromSubscription(subscription, Agency);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, Agency);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, Agency);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleInvoicePaymentSucceeded(invoice, Agency);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await handleInvoicePaymentFailed(invoice, Agency);
        }
        break;
      }

      case "payment_intent.succeeded": {
        // Backup pour CPC (au cas où checkout.session.completed n'aurait pas fonctionné)
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata?.type === "cpc") {
          await handlePaymentIntentSucceeded(paymentIntent, Agency);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Toujours retourner 200 pour éviter les retries Stripe
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    // Retourner 200 même en cas d'erreur pour éviter les retries
    // Logger l'erreur pour investigation
    return NextResponse.json(
      { error: error.message },
      { status: 200 } // ⚠️ Important : retourner 200 même en cas d'erreur
    );
  }
}

// Handler pour paiement CPC
async function handleCpcPayment(
  session: Stripe.Checkout.Session,
  Agency: any
) {
  const agencyId = session.metadata?.agencyId;
  if (!agencyId) {
    console.error("No agencyId in session metadata");
    return;
  }

  // Récupérer les détails de la session (incluant le payment_intent)
  const sessionWithDetails = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["payment_intent"],
  });

  const paymentIntent = sessionWithDetails.payment_intent as Stripe.PaymentIntent;
  if (!paymentIntent) {
    console.error("No payment_intent in session");
    return;
  }

  const amount = paymentIntent.amount / 100; // Convertir de centimes à euros
  const paymentIntentId = paymentIntent.id;
  const chargeId = paymentIntent.latest_charge as string;

  // Créer la transaction CPC (avec vérification d'idempotency)
  const transactionResult = await createCpcTransaction({
    agencyId: new ObjectId(agencyId),
    type: "credit",
    amount: amount,
    currency: "eur",
    creditsAdded: amount, // 1€ = 1 crédit
    description: `Recharge CPC via Stripe - ${amount}€`,
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: chargeId,
    stripeCheckoutSessionId: session.id,
    metadata: {
      pack: session.metadata?.pack,
    },
  });

  if (!transactionResult.success) {
    // Transaction déjà traitée (idempotency) - c'est OK
    console.log("Transaction déjà traitée (idempotency):", transactionResult.error);
    return;
  }

  // Créditer le compte de l'agence
  await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    {
      $inc: {
        "cpc.balance": amount,
      },
      $set: {
        "cpc.lastRechargeAt": new Date(),
        updatedAt: new Date(),
      },
    }
  );

  console.log(`CPC payment processed: ${amount}€ credited to agency ${agencyId}`);
}

// Handler pour nouvelle souscription (depuis checkout.session.completed)
async function handleSubscriptionCreated(
  session: Stripe.Checkout.Session,
  Agency: any
) {
  const agencyId = session.metadata?.agencyId;
  // Support les deux formats : nouveau (pack) et ancien (plan)
  const pack = (session.metadata?.pack || session.metadata?.plan?.toUpperCase()) as PackType;

  if (!agencyId || !pack) {
    console.error("Missing agencyId or pack in session metadata");
    return;
  }

  // Récupérer la subscription depuis Stripe
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateAgencySubscription(agencyId, subscription, pack, Agency);
}

// Handler pour nouvelle souscription (depuis customer.subscription.created)
async function handleSubscriptionCreatedFromSubscription(
  subscription: Stripe.Subscription,
  Agency: any
) {
  const agencyId = subscription.metadata?.agencyId;
  const pack = (subscription.metadata?.pack || subscription.metadata?.plan?.toUpperCase()) as PackType;

  if (!agencyId || !pack) {
    console.error("Missing agencyId or pack in subscription metadata");
    return;
  }

  await updateAgencySubscription(agencyId, subscription, pack, Agency);
}

// Handler pour mise à jour d'abonnement
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  Agency: any
) {
  const agencyId = subscription.metadata?.agencyId;
  const pack = (subscription.metadata?.pack || subscription.metadata?.plan?.toUpperCase()) as PackType;

  if (!agencyId) {
    // Essayer de trouver l'agence par stripeSubscriptionId
    const agency = await Agency.findOne({ stripeSubscriptionId: subscription.id });
    if (!agency) {
      console.error("Agency not found for subscription update");
      return;
    }
    await updateAgencySubscription(
      agency._id.toString(),
      subscription,
      pack || (agency.subscription?.pack as PackType),
      Agency
    );
    return;
  }

  await updateAgencySubscription(agencyId, subscription, pack, Agency);
}

// Handler pour annulation d'abonnement
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  Agency: any
) {
  // Trouver l'agence par stripeSubscriptionId
  const agency = await Agency.findOne({ stripeSubscriptionId: subscription.id });
  if (!agency) {
    console.error("Agency not found for subscription deletion");
    return;
  }

  // Passer au pack FREE
  await Agency.updateOne(
    { _id: agency._id },
    {
      $set: {
        "subscription.pack": "FREE",
        "subscription.autoRenew": false,
        "subscription.endDate": new Date(),
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeSubscriptionStatus: "canceled",
        stripeSubscriptionCurrentPeriodEnd: null,
        updatedAt: new Date(),
      },
      $push: {
        "subscription.history": {
          pack: agency.subscription?.pack || "FREE",
          startDate: agency.subscription?.startDate || new Date(),
          endDate: new Date(),
          reason: "Abonnement annulé",
        },
      },
    }
  );

  console.log(`Subscription canceled for agency ${agency._id}`);
}

// Handler pour paiement d'abonnement réussi
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  Agency: any
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const agency = await Agency.findOne({ stripeSubscriptionId: subscriptionId });

  if (!agency) {
    console.error("Agency not found for invoice payment succeeded");
    return;
  }

  // Mettre à jour la date de fin de période
  await Agency.updateOne(
    { _id: agency._id },
    {
      $set: {
        stripeSubscriptionStatus: subscription.status as any,
        stripeSubscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        "subscription.autoRenew": true,
        updatedAt: new Date(),
      },
    }
  );

  console.log(`Invoice payment succeeded for agency ${agency._id}`);
}

// Handler pour paiement d'abonnement échoué
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  Agency: any
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const agency = await Agency.findOne({ stripeSubscriptionId: subscriptionId });
  if (!agency) {
    console.error("Agency not found for invoice payment failed");
    return;
  }

  // Marquer l'abonnement comme past_due
  await Agency.updateOne(
    { _id: agency._id },
    {
      $set: {
        stripeSubscriptionStatus: "past_due",
        updatedAt: new Date(),
      },
    }
  );

  console.log(`Invoice payment failed for agency ${agency._id}`);
}

// Handler pour payment_intent.succeeded (backup pour CPC)
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  Agency: any
) {
  const agencyId = paymentIntent.metadata?.agencyId;
  if (!agencyId) {
    console.error("No agencyId in payment_intent metadata");
    return;
  }

  // Vérifier si une transaction existe déjà (idempotency)
  const transactionResult = await createCpcTransaction({
    agencyId: new ObjectId(agencyId),
    type: "credit",
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    creditsAdded: paymentIntent.amount / 100,
    description: `Recharge CPC via Stripe (backup) - ${paymentIntent.amount / 100}€`,
    stripePaymentIntentId: paymentIntent.id,
    metadata: paymentIntent.metadata,
  });

  if (!transactionResult.success) {
    // Déjà traité
    return;
  }

  // Créditer le compte
  await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    {
      $inc: {
        "cpc.balance": paymentIntent.amount / 100,
      },
      $set: {
        "cpc.lastRechargeAt": new Date(),
        updatedAt: new Date(),
      },
    }
  );

  console.log(`CPC payment processed (backup): ${paymentIntent.amount / 100}€ credited to agency ${agencyId}`);
}

// Helper pour mettre à jour l'abonnement d'une agence
async function updateAgencySubscription(
  agencyId: string,
  subscription: Stripe.Subscription,
  pack: PackType,
  Agency: any
) {
  const priceId = subscription.items.data[0]?.price.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);

  // Récupérer l'agence pour l'historique
  const agency = await Agency.findOne({ _id: new ObjectId(agencyId) });
  const oldPack = agency?.subscription?.pack || "FREE";

  const updateOp: any = {
    $set: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeSubscriptionStatus: status as any,
      stripeSubscriptionCurrentPeriodEnd: currentPeriodEnd,
      "subscription.pack": pack,
      "subscription.startDate": currentPeriodStart,
      "subscription.autoRenew": true,
      updatedAt: new Date(),
    },
  };

  // Ajouter à l'historique si le pack change
  if (oldPack !== pack) {
    updateOp.$push = {
      "subscription.history": {
        pack: oldPack,
        startDate: agency?.subscription?.startDate || currentPeriodStart,
        endDate: new Date(),
        reason: `Upgrade vers ${pack}`,
      },
    };
  }

  await Agency.updateOne(
    { _id: new ObjectId(agencyId) },
    updateOp
  );

  console.log(`Subscription updated for agency ${agencyId}: pack=${pack}, status=${status}`);
}
