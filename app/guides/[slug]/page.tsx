export const dynamic = "force-dynamic";
export const revalidate = 3600;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { generateMetadata as generateSeoMetadata } from "@/lib/seo";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  AlertTriangle,
  Leaf,
  Home,
} from "lucide-react";

const guides: Record<
  string,
  {
    title: string;
    description: string;
    content: string;
    icon: any;
    category: string;
  }
> = {
  "estimer-budget-renovation": {
    title: "Comment estimer le budget d'une maison à rénover",
    description:
      "Découvrez comment calculer le budget nécessaire pour rénover une maison. Guide complet avec exemples de coûts par type de travaux.",
    category: "Budget",
    icon: Calculator,
    content: `
# Comment estimer le budget d'une maison à rénover

L'estimation du budget de rénovation est une étape cruciale avant d'acheter un bien immobilier à rénover. Voici un guide complet pour vous aider à calculer les coûts réels.

## Les éléments à prendre en compte

### 1. Diagnostic complet du bien

Avant d'estimer votre budget, il est essentiel de réaliser un diagnostic complet du bien :

- **Diagnostic de performance énergétique (DPE)** : Indique la classe énergétique et les coûts estimés
- **Diagnostic technique** : Électricité, plomberie, toiture, charpente
- **Diagnostic structurel** : Fondations, murs porteurs, humidité
- **Diagnostic amiante et plomb** : Obligatoires pour les biens anciens

### 2. Coûts moyens par type de travaux

#### Rénovation électrique
- Mise aux normes complète : 80 à 150€/m²
- Tableau électrique : 1 500 à 3 000€
- Prise de terre : 500 à 1 500€

#### Rénovation plomberie
- Remplacement des canalisations : 100 à 200€/m²
- Installation salle de bain : 5 000 à 15 000€
- Installation cuisine : 8 000 à 20 000€

#### Isolation
- Isolation des murs : 50 à 100€/m²
- Isolation toiture : 30 à 80€/m²
- Isolation sols : 40 à 80€/m²

#### Chauffage
- Chaudière gaz : 3 000 à 8 000€
- Pompe à chaleur : 10 000 à 20 000€
- Poêle à bois : 2 000 à 8 000€

#### Menuiserie
- Fenêtres double vitrage : 300 à 800€/unité
- Portes d'entrée : 1 000 à 3 000€

### 3. Marge de sécurité

Ajoutez toujours une marge de sécurité de 15 à 20% pour les imprévus, car les travaux de rénovation révèlent souvent des problèmes cachés.

## Exemple de calcul

Pour une maison de 100m² à rénover complètement :

- Électricité : 10 000€
- Plomberie : 12 000€
- Isolation : 8 000€
- Chauffage : 8 000€
- Menuiserie : 6 000€
- Peinture/Enduits : 5 000€
- **Total travaux** : 49 000€
- **Marge sécurité (20%)** : 9 800€
- **Budget total estimé** : 58 800€

## Conseils pratiques

1. **Faites plusieurs devis** : Comparez au moins 3 devis par type de travaux
2. **Priorisez les travaux** : Commencez par l'essentiel (électricité, plomberie, toiture)
3. **Anticipez les aides** : MaPrimeRénov, CEE, TVA réduite peuvent réduire votre budget
4. **Planifiez dans le temps** : Étalez les travaux sur plusieurs années si nécessaire

## Conclusion

L'estimation du budget de rénovation nécessite une analyse approfondie du bien et une bonne connaissance des coûts moyens. N'hésitez pas à consulter des professionnels pour obtenir des devis précis avant de vous engager.
    `,
  },
  "pieges-a-eviter": {
    title: "Acheter une maison à rénover : pièges à éviter",
    description:
      "Les erreurs courantes à éviter lors de l'achat d'un bien à rénover. Conseils pratiques pour faire le bon choix.",
    category: "Conseils",
    icon: AlertTriangle,
    content: `
# Acheter une maison à rénover : pièges à éviter

L'achat d'un bien à rénover peut être une excellente opportunité, mais attention aux pièges ! Voici les erreurs courantes à éviter.

## Piège n°1 : Sous-estimer le budget de travaux

**Le problème** : Beaucoup d'acheteurs sous-estiment le coût réel des travaux.

**La solution** :
- Faites toujours un diagnostic complet avant l'achat
- Ajoutez 20% de marge de sécurité au budget estimé
- Consultez plusieurs artisans pour obtenir des devis réalistes

## Piège n°2 : Négliger les diagnostics obligatoires

**Le problème** : Certains vendeurs minimisent les problèmes du bien.

**La solution** :
- Exigez tous les diagnostics obligatoires (DPE, amiante, plomb, etc.)
- Faites réaliser un diagnostic technique complet par un professionnel
- Vérifiez l'état de la toiture, des fondations, de l'électricité

## Piège n°3 : Ne pas vérifier les règles d'urbanisme

**Le problème** : Certains travaux peuvent être interdits ou soumis à autorisation.

**La solution** :
- Vérifiez le PLU (Plan Local d'Urbanisme) de la commune
- Renseignez-vous sur les règles de copropriété si applicable
- Consultez le cadastre pour vérifier les limites de propriété

## Piège n°4 : Oublier les frais annexes

**Le problème** : Le budget ne prend en compte que les travaux, pas les frais annexes.

**La solution** :
- Prévoyez les frais de notaire, de garantie, d'assurance
- Anticipez les frais de déménagement et de stockage
- Budgetez les frais de raccordement (eau, électricité, gaz)

## Piège n°5 : Acheter sans visiter plusieurs fois

**Le problème** : Une seule visite ne suffit pas pour évaluer un bien à rénover.

**La solution** :
- Visitez le bien à différents moments de la journée
- Vérifiez l'isolation phonique et les nuisances
- Testez l'éclairage naturel et la ventilation

## Conclusion

L'achat d'un bien à rénover nécessite une approche méthodique et prudente. Prenez le temps de bien analyser le bien, estimez correctement le budget, et entourez-vous de professionnels compétents.
    `,
  },
  "renovation-energetique-aides": {
    title: "Rénovation énergétique : aides et DPE",
    description:
      "Toutes les aides financières disponibles pour la rénovation énergétique. MaPrimeRénov, CEE, TVA réduite...",
    category: "Aides",
    icon: Leaf,
    content: `
# Rénovation énergétique : aides et DPE

Les travaux de rénovation énergétique peuvent bénéficier de nombreuses aides financières. Voici un guide complet.

## Les principales aides financières

### MaPrimeRénov

**Qu'est-ce que c'est ?**
Aide de l'État pour la rénovation énergétique des logements.

**Montants** :
- Isolation : jusqu'à 75€/m²
- Chauffage performant : jusqu'à 4 000€
- Fenêtres double vitrage : jusqu'à 100€/m²

**Conditions** :
- Logement de plus de 15 ans
- Résidence principale
- Revenus du foyer pris en compte

### Certificats d'Économies d'Énergie (CEE)

**Qu'est-ce que c'est ?**
Aide financée par les fournisseurs d'énergie.

**Montants** :
- Isolation : 20 à 50€/m²
- Chaudière performante : 500 à 1 500€
- Pompe à chaleur : 2 000 à 4 000€

### TVA réduite à 5,5%

**Qu'est-ce que c'est ?**
Taux de TVA réduit pour les travaux de rénovation énergétique.

**Conditions** :
- Logement de plus de 2 ans
- Travaux réalisés par un professionnel RGE (Reconnu Garant de l'Environnement)

### Éco-PTZ (Éco-Prêt à Taux Zéro)

**Qu'est-ce que c'est ?**
Prêt sans intérêts pour financer les travaux de rénovation énergétique.

**Montants** :
- Jusqu'à 30 000€ sur 15 ans
- Cumulable avec MaPrimeRénov

## Le Diagnostic de Performance Énergétique (DPE)

### Comprendre le DPE

Le DPE classe votre logement de A (très performant) à G (très énergivore).

**Classes énergétiques** :
- A, B, C : Performant
- D, E : Moyen
- F, G : Énergivore

### Impact sur les aides

Plus votre logement est énergivore, plus les aides sont importantes :
- Classe F ou G : Aides maximales
- Classe D ou E : Aides modérées
- Classe A, B, C : Aides réduites

## Comment bénéficier des aides

1. **Faites réaliser un DPE** : Obligatoire pour accéder aux aides
2. **Choisissez des artisans RGE** : Obligatoire pour MaPrimeRénov et TVA réduite
3. **Déposez votre dossier** : Sur le site MaPrimeRénov.fr
4. **Conservez les justificatifs** : Factures, devis, attestations

## Conclusion

Les aides à la rénovation énergétique peuvent réduire significativement votre budget. Renseignez-vous bien et faites appel à des professionnels RGE pour bénéficier de toutes les aides disponibles.
    `,
  },
  "renover-ou-cle-en-main": {
    title: "Maison à rénover ou clé en main ?",
    description:
      "Comparatif entre l'achat d'un bien à rénover et un bien clé en main. Avantages et inconvénients de chaque option.",
    category: "Conseils",
    icon: Home,
    content: `
# Maison à rénover ou clé en main ?

Découvrez les avantages et inconvénients de chaque option pour faire le bon choix.

## Maison à rénover : avantages

### Prix d'achat plus bas
- Généralement 20 à 40% moins cher qu'un bien clé en main
- Opportunité d'acquérir un bien dans un secteur cher à moindre coût

### Personnalisation totale
- Vous choisissez tous les matériaux et finitions
- Vous créez un bien à votre image
- Possibilité d'optimiser l'espace selon vos besoins

### Potentiel de plus-value
- Si les travaux sont bien réalisés, la plus-value peut être importante
- Investissement rentable à long terme

## Maison à rénover : inconvénients

### Budget imprévisible
- Coûts de travaux souvent sous-estimés
- Imprévus fréquents (humidité, structure, etc.)
- Budget final parfois supérieur à un bien clé en main

### Délais et contraintes
- Travaux qui peuvent durer plusieurs mois ou années
- Nécessité de logement temporaire pendant les travaux
- Stress et fatigue liés au suivi des travaux

### Compétences requises
- Nécessite de bonnes connaissances en bâtiment
- Gestion de plusieurs corps de métier
- Risque de mauvais choix techniques

## Bien clé en main : avantages

### Sérénité
- Vous emménagez immédiatement
- Pas de travaux à prévoir
- Budget maîtrisé dès le départ

### Finitions déjà réalisées
- Tout est prêt à l'usage
- Pas de surprises
- Conformité aux normes garantie

## Bien clé en main : inconvénients

### Prix plus élevé
- Prix d'achat généralement plus élevé
- Moins de marge de négociation

### Personnalisation limitée
- Finitions déjà choisies
- Moins de possibilités de modification
- Peut ne pas correspondre à vos goûts

## Comment choisir ?

### Choisissez une maison à rénover si :
- Vous avez un budget serré pour l'achat
- Vous aimez les projets et la personnalisation
- Vous avez du temps et de l'énergie
- Vous avez des compétences en bâtiment ou un bon réseau d'artisans

### Choisissez un bien clé en main si :
- Vous voulez emménager rapidement
- Vous préférez la sérénité
- Vous avez un budget suffisant
- Vous n'avez pas envie de gérer des travaux

## Conclusion

Le choix entre un bien à rénover et un bien clé en main dépend de votre situation, de votre budget, et de vos envies. Les deux options ont leurs avantages, l'important est de choisir celle qui correspond le mieux à votre projet de vie.
    `,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides[slug];

  if (!guide) {
    return {
      title: "Guide non trouvé",
      robots: { index: false, follow: false },
    };
  }

  return generateSeoMetadata({
    title: `${guide.title} | Guides rénovation`,
    description: guide.description,
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://renovscout.fr"}/guides/${slug}`,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides[slug];

  if (!guide) {
    notFound();
  }

  const Icon = guide.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 px-4 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/50 to-teal-50/30">
          <div className="container mx-auto max-w-4xl">
            <Button asChild variant="ghost" className="mb-6">
              <Link href="/guides">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux guides
              </Link>
            </Button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">
                {guide.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {guide.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {guide.description}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-0 shadow-md">
              <CardContent className="p-8">
                <div
                  className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: guide.content
                      .split("\n")
                      .map((line) => {
                        // Simple markdown to HTML conversion
                        if (line.startsWith("# ")) {
                          return `<h1>${line.substring(2)}</h1>`;
                        }
                        if (line.startsWith("## ")) {
                          return `<h2>${line.substring(3)}</h2>`;
                        }
                        if (line.startsWith("### ")) {
                          return `<h3>${line.substring(4)}</h3>`;
                        }
                        if (line.startsWith("**") && line.endsWith("**")) {
                          return `<p><strong>${line.substring(2, line.length - 2)}</strong></p>`;
                        }
                        if (line.trim() === "") {
                          return "<br/>";
                        }
                        if (line.startsWith("- ")) {
                          return `<li>${line.substring(2)}</li>`;
                        }
                        return `<p>${line}</p>`;
                      })
                      .join(""),
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Prêt à trouver votre bien à rénover ?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Utilisez notre moteur de recherche pour découvrir des
                  opportunités de rénovation partout en France.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/search">
                      Rechercher des annonces
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/guides">Voir tous les guides</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
