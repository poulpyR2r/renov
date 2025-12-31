import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { getCurrentTermsOfService, LegalDocumentType } from "@/models/TermsOfService";

const TYPE_MAPPING: Record<string, LegalDocumentType> = {
  "cgu": "CGU",
  "mentions-legales": "MENTIONS_LEGALES",
  "politique-confidentialite": "POLITIQUE_CONFIDENTIALITE",
  "politique-cookies": "POLITIQUE_COOKIES",
  "cgv": "CGV",
};

const TYPE_TITLES: Record<string, string> = {
  "cgu": "Conditions Générales d'Utilisation",
  "mentions-legales": "Mentions Légales",
  "politique-confidentialite": "Politique de Confidentialité",
  "politique-cookies": "Politique de Cookies",
  "cgv": "Conditions Générales de Vente",
};

interface LegalDocumentPageProps {
  params: Promise<{ type: string }>;
}

async function getLegalDocument(type: string) {
  try {
    const normalizedType = TYPE_MAPPING[type.toLowerCase()];
    if (!normalizedType) {
      return null;
    }

    const document = await getCurrentTermsOfService(normalizedType);
    return document;
  } catch (error) {
    console.error("Error fetching legal document:", error);
    return null;
  }
}

export default async function LegalDocumentPage({
  params,
}: LegalDocumentPageProps) {
  const { type } = await params;
  const normalizedType = type.toLowerCase();

  if (!TYPE_MAPPING[normalizedType]) {
    notFound();
  }

  const document = await getLegalDocument(normalizedType);

  if (!document) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>{document.title || TYPE_TITLES[normalizedType]}</CardTitle>
              {document.version && (
                <p className="text-sm text-muted-foreground mt-2">
                  Version {document.version}
                  {document.publishedAt && (
                    <span className="ml-2">
                      - Publiée le{" "}
                      {new Date(document.publishedAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </p>
              )}
            </CardHeader>
            <CardContent className="prose max-w-none">
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: document.content.replace(/\n/g, "<br />"),
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
