import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");

  // Lists
  html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Wrap in paragraphs
  html = `<p>${html}</p>`;

  return html;
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();

    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { subject, content } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Sujet et contenu requis" },
        { status: 400 }
      );
    }

    const contentHtml = markdownToHtml(content);

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          ${contentHtml}
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>Vous recevez cet email car vous êtes abonné à notre newsletter.</p>
          <p><a href="#" style="color: #667eea;">Se désabonner</a></p>
        </div>
      </div>
    `;

    return NextResponse.json({ success: true, html });
  } catch (error) {
    console.error("Error previewing newsletter:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

