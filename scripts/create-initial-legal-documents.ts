/**
 * Script pour créer les versions initiales des documents légaux
 * Usage: tsx scripts/create-initial-legal-documents.ts
 */

import { dbConnect } from "../lib/mongodb";
import { ObjectId } from "mongodb";

const INITIAL_DOCUMENTS = {
  CGU: {
    type: "CGU" as const,
    version: "1.0.0",
    title: "Conditions Générales d'Utilisation",
    content: `CONDITIONS GÉNÉRALES D'UTILISATION

1. OBJET

Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation de la plateforme Maisons à Rénover (ci-après "la Plateforme") accessible à l'adresse www.renovscout.com.

L'utilisation de la Plateforme implique l'acceptation sans réserve des présentes CGU par l'utilisateur.

2. ÉDITEUR DE LA PLATEFORME

La Plateforme est éditée par Maisons à Rénover.

3. ACCÈS À LA PLATEFORME

La Plateforme est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, connexion Internet, etc.) sont à sa charge.

4. DONNÉES PERSONNELLES

Les données personnelles collectées sur la Plateforme sont traitées conformément à notre Politique de Confidentialité, accessible depuis le pied de page du site.

5. PROPRIÉTÉ INTELLECTUELLE

L'ensemble des contenus présents sur la Plateforme (textes, images, vidéos, logos, etc.) sont la propriété exclusive de Maisons à Rénover ou de ses partenaires et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments de la Plateforme est interdite, sauf autorisation écrite préalable de Maisons à Rénover.

6. LIMITES DE RESPONSABILITÉ

Maisons à Rénover s'efforce de fournir sur la Plateforme des informations aussi précises que possible. Toutefois, Maisons à Rénover ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.

7. MODIFICATION DES CGU

Maisons à Rénover se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs sont donc invités à les consulter régulièrement.

8. DROIT APPLICABLE ET JURIDICTION

Les présentes CGU sont régies par le droit français. En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément aux règles de compétence en vigueur.`,
  },
  MENTIONS_LEGALES: {
    type: "MENTIONS_LEGALES" as const,
    version: "1.0.0",
    title: "Mentions Légales",
    content: `MENTIONS LÉGALES

1. ÉDITEUR

Le site www.renovscout.com est édité par Maisons à Rénover.

2. HÉBERGEMENT

Le site est hébergé par Vercel Inc.

3. DIRECTEUR DE PUBLICATION

Le directeur de publication est Maisons à Rénover.

4. CONTACT

Pour toute question ou réclamation, vous pouvez nous contacter via les moyens mis à disposition sur la Plateforme.

5. PROPRIÉTÉ INTELLECTUELLE

L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.

La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.

6. PROTECTION DES DONNÉES PERSONNELLES

Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.

7. COOKIES

Le site utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations, consultez notre Politique de Cookies.`,
  },
  POLITIQUE_CONFIDENTIALITE: {
    type: "POLITIQUE_CONFIDENTIALITE" as const,
    version: "1.0.0",
    title: "Politique de Confidentialité",
    content: `POLITIQUE DE CONFIDENTIALITÉ

1. INTRODUCTION

Maisons à Rénover s'engage à protéger la vie privée de ses utilisateurs. La présente Politique de Confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles.

2. DONNÉES COLLECTÉES

Nous collectons les données suivantes :
- Données d'identification (nom, prénom, adresse e-mail)
- Données de connexion (adresse IP, logs de connexion)
- Données de navigation (cookies, données de géolocalisation)
- Données relatives à votre utilisation de la Plateforme

3. FINALITÉS DU TRAITEMENT

Vos données personnelles sont traitées pour :
- Fournir et améliorer nos services
- Personnaliser votre expérience utilisateur
- Envoyer des communications relatives à nos services
- Assurer la sécurité de la Plateforme
- Respecter nos obligations légales et réglementaires

4. BASE JURIDIQUE DU TRAITEMENT

Le traitement de vos données personnelles repose sur :
- Votre consentement
- L'exécution d'un contrat
- Le respect d'une obligation légale
- La poursuite d'un intérêt légitime

5. CONSERVATION DES DONNÉES

Vos données personnelles sont conservées pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées, conformément aux obligations légales applicables.

6. VOS DROITS

Conformément au RGPD, vous disposez des droits suivants :
- Droit d'accès à vos données personnelles
- Droit de rectification
- Droit à l'effacement
- Droit à la limitation du traitement
- Droit à la portabilité des données
- Droit d'opposition

Pour exercer ces droits, contactez-nous via les moyens mis à disposition sur la Plateforme.

7. SÉCURITÉ

Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte, destruction ou altération.

8. COOKIES

Notre Plateforme utilise des cookies. Pour plus d'informations, consultez notre Politique de Cookies.

9. MODIFICATIONS

La présente Politique de Confidentialité peut être modifiée à tout moment. La version en vigueur est celle publiée sur la Plateforme.`,
  },
  POLITIQUE_COOKIES: {
    type: "POLITIQUE_COOKIES" as const,
    version: "1.0.0",
    title: "Politique de Cookies",
    content: `POLITIQUE DE COOKIES

1. QU'EST-CE QU'UN COOKIE ?

Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette, smartphone) lors de la visite d'un site web. Il permet au site de reconnaître votre navigateur et de mémoriser certaines informations vous concernant.

2. TYPES DE COOKIES UTILISÉS

Nous utilisons les types de cookies suivants :

2.1. Cookies strictement nécessaires
Ces cookies sont indispensables au fonctionnement de la Plateforme et ne peuvent pas être désactivés. Ils sont généralement définis en réponse à des actions que vous effectuez et qui constituent une demande de services.

2.2. Cookies de performance
Ces cookies nous permettent de compter les visites et les sources de trafic afin d'améliorer les performances de notre site. Ils nous aident à savoir quelles pages sont les plus et le moins populaires.

2.3. Cookies de fonctionnalité
Ces cookies permettent au site de fournir des fonctionnalités et une personnalisation améliorées. Ils peuvent être définis par nous ou par des fournisseurs tiers.

2.4. Cookies de ciblage
Ces cookies peuvent être définis par nos partenaires publicitaires sur notre site. Ils peuvent être utilisés pour établir un profil de vos intérêts et vous montrer des contenus pertinents sur d'autres sites.

3. DURÉE DE CONSERVATION

Les cookies ont une durée de vie limitée qui varie selon leur type. Certains cookies expirent à la fermeture de votre navigateur (cookies de session), d'autres persistent plus longtemps (cookies persistants).

4. GESTION DES COOKIES

Vous pouvez gérer vos préférences en matière de cookies via les paramètres de votre navigateur. Vous pouvez ainsi :
- Accepter tous les cookies
- Refuser tous les cookies
- Être averti avant l'enregistrement d'un cookie

Attention : la désactivation de certains cookies peut affecter le fonctionnement de la Plateforme.

5. COOKIES TIERS

Certains cookies sont placés par des services tiers apparaissant sur nos pages. Nous n'avons pas le contrôle sur ces cookies. Nous vous invitons à consulter les politiques de cookies de ces services tiers.

6. MODIFICATIONS

La présente Politique de Cookies peut être modifiée à tout moment. La version en vigueur est celle publiée sur la Plateforme.`,
  },
  CGV: {
    type: "CGV" as const,
    version: "1.0.0",
    title: "Conditions Générales de Vente",
    content: `CONDITIONS GÉNÉRALES DE VENTE

1. OBJET

Les présentes Conditions Générales de Vente (ci-après "CGV") régissent les relations contractuelles entre Maisons à Rénover et les agences immobilières utilisant la Plateforme pour la mise en avant de leurs annonces immobilières.

2. PARTIES

Les présentes CGV sont conclues entre :
- Maisons à Rénover, éditrice de la Plateforme
- L'agence immobilière utilisant les services de la Plateforme (ci-après "l'Agence")

3. SERVICES PROPOSÉS

Maisons à Rénover propose aux agences immobilières des services de mise en avant et de promotion de leurs annonces immobilières sur la Plateforme, notamment :
- Publication d'annonces immobilières
- Mise en avant des annonces (sponsoring)
- Statistiques et analyses de performance
- Outils de gestion des annonces

4. INSCRIPTION

Pour utiliser les services de la Plateforme, l'Agence doit créer un compte et accepter les présentes CGV. L'Agence garantit que les informations communiquées sont exactes et s'engage à les mettre à jour en cas de modification.

5. TARIFICATION

Les services de mise en avant sont facturés selon les tarifs en vigueur au moment de la commande. Les tarifs sont exprimés en euros, toutes taxes comprises. Maisons à Rénover se réserve le droit de modifier ses tarifs à tout moment, étant entendu que les tarifs applicables sont ceux en vigueur au moment de la commande.

6. PAIEMENT

Le paiement s'effectue selon les modalités définies lors de la souscription du service. L'Agence s'engage à payer les sommes dues dans les délais convenus.

7. OBLIGATIONS DES PARTIES

7.1. Obligations de Maisons à Rénover
Maisons à Rénover s'engage à :
- Fournir les services dans les meilleures conditions
- Assurer la disponibilité de la Plateforme dans la mesure du possible
- Respecter la confidentialité des données de l'Agence

7.2. Obligations de l'Agence
L'Agence s'engage à :
- Fournir des informations exactes et à jour
- Respecter les règles d'utilisation de la Plateforme
- Ne pas utiliser la Plateforme à des fins illégales

8. PROPRIÉTÉ INTELLECTUELLE

L'ensemble des contenus de la Plateforme (textes, images, logos, etc.) sont la propriété exclusive de Maisons à Rénover. L'Agence dispose d'un droit d'utilisation non exclusif et non transférable des services de la Plateforme pour les besoins de son activité.

9. LIMITES DE RESPONSABILITÉ

Maisons à Rénover ne pourra être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la Plateforme, sauf en cas de faute lourde ou de dol.

10. DURÉE ET RÉSILIATION

Les présentes CGV s'appliquent pour la durée d'utilisation des services par l'Agence. L'Agence peut résilier son compte à tout moment. Maisons à Rénover peut suspendre ou résilier l'accès de l'Agence en cas de manquement aux présentes CGV.

11. MODIFICATION DES CGV

Maisons à Rénover se réserve le droit de modifier les présentes CGV à tout moment. Les modifications sont applicables dès leur publication sur la Plateforme.

12. DROIT APPLICABLE ET JURIDICTION

Les présentes CGV sont régies par le droit français. En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français.`,
  },
};

async function createInitialDocuments() {
  try {
    const db = await dbConnect();
    const collection = db.collection("termsofservice");

    // Vérifier si des documents existent déjà
    const existing = await collection.countDocuments({});
    if (existing > 0) {
      console.log(
        `⚠️  ${existing} document(s) existe(nt) déjà dans la base. Le script ne créera pas de documents initiaux pour éviter les doublons.`
      );
      console.log("Pour forcer la création, videz d'abord la collection.");
      process.exit(0);
    }

    const now = new Date();

    for (const [key, doc] of Object.entries(INITIAL_DOCUMENTS)) {
      const document = {
        ...doc,
        status: "PUBLISHED" as const,
        isCurrent: true,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(document);
      console.log(`✅ ${doc.title} (v${doc.version}) créé avec l'ID: ${result.insertedId}`);
    }

    // S'assurer qu'il n'y a qu'un seul isCurrent=true par type
    for (const type of Object.keys(INITIAL_DOCUMENTS)) {
      const docs = await collection
        .find({ type, isCurrent: true })
        .sort({ createdAt: -1 })
        .toArray();

      if (docs.length > 1) {
        // Garder seulement le plus récent
        const toKeep = docs[0];
        const toUpdate = docs.slice(1);

        for (const doc of toUpdate) {
          await collection.updateOne(
            { _id: doc._id },
            { $set: { isCurrent: false, updatedAt: new Date() } }
          );
        }

        console.log(`✅ Mis à jour: seul le document le plus récent de type ${type} est marqué comme courant`);
      }
    }

    console.log("\n✅ Tous les documents légaux initiaux ont été créés avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création des documents:", error);
    process.exit(1);
  }
}

createInitialDocuments();
