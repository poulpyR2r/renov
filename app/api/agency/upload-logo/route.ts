import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getUserByEmail } from "@/models/User";
import { getAgencyByOwnerId } from "@/models/Agency";

// Max file size: 2MB pour les logos
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user || user.role !== "agency" || !user.agencyId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas une agence" },
        { status: 403 }
      );
    }

    const agency = await getAgencyByOwnerId(user._id!.toString());
    if (!agency) {
      return NextResponse.json(
        { error: "Agence non trouvée" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier envoyé" },
        { status: 400 }
      );
    }

    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Type de fichier non autorisé: ${file.type}. Formats acceptés: JPEG, PNG, WebP, SVG`,
        },
        { status: 400 }
      );
    }

    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 2MB)" },
        { status: 400 }
      );
    }

    // Générer un nom unique
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "png";
    const fileName = `agency-${agency._id?.toString()}-${timestamp}-${random}.${extension}`;

    // Créer le dossier s'il n'existe pas
    const uploadDir = join(process.cwd(), "public", "uploads", "agencies");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Lire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sauvegarder
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // URL publique
    const logoUrl = `/uploads/agencies/${fileName}`;

    return NextResponse.json({
      success: true,
      url: logoUrl,
      message: "Logo uploadé avec succès",
    });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du logo" },
      { status: 500 }
    );
  }
}
