"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Mail, FileCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AgencyPendingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>

            <h1 className="text-2xl font-bold mb-2">Demande en cours de traitement</h1>
            <p className="text-muted-foreground mb-8">
              Merci pour votre inscription ! Notre équipe examine votre dossier.
            </p>

            <div className="space-y-4 text-left mb-8">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Vérification des informations</p>
                  <p className="text-sm text-muted-foreground">
                    Nous vérifions votre SIRET, carte professionnelle et garantie financière.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Réponse sous 48h</p>
                  <p className="text-sm text-muted-foreground">
                    Vous recevrez un email de confirmation une fois votre compte validé.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  Retour à l'accueil
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Des questions ?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contactez-nous
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

