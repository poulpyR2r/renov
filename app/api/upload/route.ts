import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier envoyé" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images autorisées" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];
    const uploadDir = join(process.cwd(), "public", "uploads", "listings");

    // Créer le dossier s'il n'existe pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      // Vérifier le type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé: ${file.type}` },
          { status: 400 }
        );
      }

      // Vérifier la taille
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Fichier trop volumineux (max 5MB)" },
          { status: 400 }
        );
      }

      // Générer un nom unique
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `${timestamp}-${random}.${extension}`;

      // Lire le fichier
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Sauvegarder
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // URL publique
      uploadedUrls.push(`/uploads/listings/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} image(s) uploadée(s)`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}
