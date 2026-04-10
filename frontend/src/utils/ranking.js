import { issuerTrustSignals } from "../lib/constants";

const achievementLevelSignals = [
  { terms: ["winner", "1st", "first", "gold", "champion", "top rank"], score: 28 },
  { terms: ["runner up", "2nd", "second", "silver", "finalist"], score: 22 },
  { terms: ["top", "merit", "shortlisted", "distinction"], score: 18 },
  { terms: ["participant", "attendee", "member"], score: 10 }
];

const domainSignals = {
  blockchain: ["blockchain", "web3", "solidity", "ethereum", "smart contract"],
  engineering: ["engineering", "developer", "software", "coding", "programming"],
  academic: ["academic", "course", "semester", "college", "university", "cgpa"],
  research: ["research", "paper", "publication", "journal", "conference"],
  leadership: ["leadership", "team", "mentor", "organizer", "club"],
  design: ["design", "ui", "ux", "product", "creative"],
  community: ["volunteer", "community", "impact", "service", "outreach"]
};

const getSourceText = (credential) =>
  [
    credential.title,
    credential.issuer,
    credential.description,
    credential.type
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const detectDomains = (credential) => {
  const text = getSourceText(credential);

  return Object.entries(domainSignals)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([domain]) => domain);
};

const buildPortfolioContext = (credentials) => {
  const counts = new Map();

  credentials.forEach((credential) => {
    detectDomains(credential).forEach((domain) => {
      counts.set(domain, (counts.get(domain) || 0) + 1);
    });
  });

  return counts;
};

const getIssuerWeight = (credential) => {
  const text = `${credential.issuer} ${credential.title}`.toLowerCase();

  const matchedWeight = Object.entries(issuerTrustSignals).find(([keyword]) =>
    text.includes(keyword)
  );

  if (matchedWeight) {
    return matchedWeight[1];
  }

  if (credential.source === "issued") {
    return 22;
  }

  return 12;
};

const getAchievementLevel = (credential) => {
  const text = getSourceText(credential);

  const matchedLevel = achievementLevelSignals.find(({ terms }) =>
    terms.some((term) => text.includes(term))
  );

  return matchedLevel ? matchedLevel.score : 14;
};

const getVerificationBonus = (credential) => (credential.verified ? 24 : 8);

const getRecencyBonus = (credential) => {
  const ageInDays =
    Math.max(1, Date.now() - new Date(credential.createdAt).getTime()) /
    (1000 * 60 * 60 * 24);

  if (ageInDays <= 30) return 20;
  if (ageInDays <= 180) return 16;
  if (ageInDays <= 365) return 12;
  if (ageInDays <= 730) return 8;
  return 4;
};

const getRelevanceScore = (credential, portfolioContext) => {
  const matchedDomains = detectDomains(credential);

  if (!matchedDomains.length) {
    return credential.source === "issued" ? 10 : 6;
  }

  return matchedDomains.reduce((score, domain) => {
    const frequency = portfolioContext.get(domain) || 1;
    return score + Math.min(14, frequency * 2);
  }, 0);
};

export const scoreCredential = (credential, portfolioContext) => {
  const issuerWeight = getIssuerWeight(credential);
  const achievementLevel = getAchievementLevel(credential);
  const verificationBonus = getVerificationBonus(credential);
  const recencyBonus = getRecencyBonus(credential);
  const relevanceScore = getRelevanceScore(credential, portfolioContext);

  return (
    issuerWeight +
    achievementLevel +
    verificationBonus +
    recencyBonus +
    relevanceScore
  );
};

export const rankCredentials = (credentials) => {
  const portfolioContext = buildPortfolioContext(credentials);

  return [...credentials]
    .map((credential) => ({
      ...credential,
      score: scoreCredential(credential, portfolioContext)
    }))
    .sort((left, right) => right.score - left.score);
};
