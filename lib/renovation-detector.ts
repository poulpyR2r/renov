const RENOVATION_KEYWORDS = {
  high: [
    "à rénover",
    "a renover",
    "travaux à prévoir",
    "travaux a prevoir",
    "gros travaux",
    "rénovation complète",
    "renovation complete",
    "à rafraîchir",
    "a rafraichir",
    "dans son jus",
    "à refaire",
  ],
  medium: ["potentiel", "ancien", "investisseur", "rénovation", "renovation", "travaux", "chantier", "restaurer"],
  low: ["charme", "authentique", "caractère", "cachet", "possibilités", "opportunité", "opportunite"],
}

export function detectRenovationNeed(
  title: string,
  description: string,
): {
  score: number
  keywords: string[]
} {
  const text = `${title} ${description}`.toLowerCase()
  const foundKeywords: string[] = []
  let score = 0

  for (const keyword of RENOVATION_KEYWORDS.high) {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
      score += 10
    }
  }

  for (const keyword of RENOVATION_KEYWORDS.medium) {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
      score += 5
    }
  }

  for (const keyword of RENOVATION_KEYWORDS.low) {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
      score += 2
    }
  }

  return {
    score: Math.min(score, 100),
    keywords: [...new Set(foundKeywords)],
  }
}
