/**
 * Sanctions Screening Rules - AlgeriaTrade.dz
 * Implements screening against international sanctions lists:
 * - OFAC (Office of Foreign Assets Control) - US Treasury
 * - EU Consolidated Financial Sanctions List
 * - UN Security Council Consolidated List
 * - Local Algerian restricted parties list
 * 
 * Legal Framework:
 * - UN Security Council Resolutions (binding on member states)
 * - US Executive Orders (extraterritorial application risk)
 * - EU Council Regulations (direct effect in EU and partners)
 * - Algerian regulations on financial crimes (Ordonnance 96-22)
 */

export interface SanctionEntity {
  id: string;
  names: EntityName[];
  aliases?: string[];
  dateOfBirth?: string;
  nationality?: string;
  address?: AddressInfo[];
  identification?: IdentificationDoc[];
  sanctions: ActiveSanction[];
  additionalInfo?: string;
  lastUpdated: string;
  source: SanctionSource;
}

export interface EntityName {
  fullName: string;
  script?: 'Latin' | 'Cyrillic' | 'Arabic' | 'Chinese';
  originalScriptName?: string;
}

export interface AddressInfo {
  address: string;
  city: string;
  country: string;
  countryIso2: string;
}

export interface IdentificationDoc {
  type: 'passport' | 'national_id' | 'tax_id' | 'registration_number' | 'other';
  number: string;
  country: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface ActiveSanction {
  type: SanctionType;
  listName: string;
  effectiveDate: string;
  basis: string;
  remarks?: string;
}

export type SanctionType = 
  | 'asset_freeze'
  | 'travel_ban'
  | 'arms_embargo'
  | 'trade_embargo'
  | 'comprehensive'
  | 'sectoral';

export type SanctionSource = 
  | 'OFAC_SDN'           // OFAC Specially Designated Nationals
  | 'OFAC_FSE'           // OFAC Foreign Sanctions Evaders
  | 'OFAC_SSI'           // OFAC Sectoral Sanctions Identifications
  | 'OFAC_EU'            // OFAC EU Executive Order 14024
  | 'EU_CONSOLIDATED'    // EU Financial Sanctions
  | 'UN_CONSOLIDATED'    // UN Security Council
  | 'DZ_NATIONAL'        // Algeria national list
  | 'INTERPOL_RED'       // Interpol Red Notice
  | 'INTERNAL_WATCH';    // Internal watchlist

export interface SanctionRule {
  id: string;
  source: SanctionSource;
  name: string;
  description: string;
  updateFrequency: string;
  apiUrl?: string;
  isActive: boolean;
}

// Sanctions Lists Configuration
export const SANCTIONS_LISTS: SanctionRule[] = [
  {
    id: 'list-ofac-sdn',
    source: 'OFAC_SDN',
    name: 'OFAC SDN List - Specially Designated Nationals',
    description: 'US Treasury list of individuals/companies owned/blocked by US government',
    updateFrequency: 'Daily',
    apiUrl: 'https://www.treasury.gov/ofac/downloads/sdnlist.xml',
    isActive: true,
  },
  {
    id: 'list-eu-consolidated',
    source: 'EU_CONSOLIDATED',
    name: 'EU Consolidated Financial Sanctions List',
    description: 'European Union consolidated list of persons subject to financial sanctions',
    updateFrequency: 'Daily',
    apiUrl: 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xml/fullSanctionsList_1_1/content?token=dG9rZW4tMg',
    isActive: true,
  },
  {
    id: 'list-un-consolidated',
    source: 'UN_CONSOLIDATED',
    name: 'UN Security Council Consolidated List',
    description: 'United Nations Security Council consolidated list of sanctioned entities',
    updateFrequency: 'Weekly',
    apiUrl: 'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
    isActive: true,
  },
  {
    id: 'list-dz-national',
    source: 'DZ_NATIONAL',
    name: 'Algerian National Restricted Parties List',
    description: 'National list maintained by Bank of Algeria and Ministry of Finance',
    updateFrequency: 'Monthly',
    isActive: true,
  },
  {
    id: 'list-interpol-red',
    source: 'INTERPOL_RED',
    name: 'Interpol Red Notices',
    description: 'International arrest warrants issued by Interpol member countries',
    updateFrequency: 'Real-time',
    isActive: true,
  },
];

// Risk Scoring Configuration
export interface RiskScoreConfig {
  matchThresholds: {
    exactMatch: number;     // 95-100%
    highConfidence: number; // 85-94%
    mediumConfidence: number; // 70-84%
    lowConfidence: number;  // 50-69%
  };
  weightFactors: {
    nameMatch: number;
    aliasMatch: number;
    dobMatch: number;
    addressMatch: number;
    idNumberMatch: number;
    nationalityMatch: number;
  };
  sanctionSeverityWeights: {
    asset_freeze: number;
    travel_ban: number;
    arms_embargo: number;
    trade_embargo: number;
    comprehensive: number;
    sectoral: number;
  };
}

export const DEFAULT_RISK_CONFIG: RiskScoreConfig = {
  matchThresholds: {
    exactMatch: 95,
    highConfidence: 85,
    mediumConfidence: 70,
    lowConfidence: 50,
  },
  weightFactors: {
    nameMatch: 35,
    aliasMatch: 20,
    dobMatch: 20,
    addressMatch: 10,
    idNumberMatch: 10,
    nationalityMatch: 5,
  },
  sanctionSeverityWeights: {
    asset_freeze: 90,
    travel_ban: 75,
    arms_embargo: 95,
    trade_embargo: 80,
    comprehensive: 100,
    sectoral: 65,
  },
};

// Screening Result Types
export interface ScreeningResult {
  referenceId: string;
  screenedEntity: ScreenedEntityInput;
  timestamp: string;
  matches: MatchResult[];
  overallRiskScore: number;
  riskLevel: RiskLevel;
  decision: ScreeningDecision;
  recommendations: string[];
}

export interface ScreenedEntityInput {
  fullName: string;
  entityType: 'individual' | 'organization';
  dateOfBirth?: string;
  nationality?: string;
  countryOfResidence?: string;
  address?: string;
  idNumber?: string;
  idType?: string;
  registrationNumber?: string;
}

export interface MatchResult {
  matchedEntity: Partial<SanctionEntity>;
  matchDetails: MatchDetail[];
  confidenceScore: number;
  riskScore: number;
  riskLevel: RiskLevel;
  sources: SanctionSource[];
  falsePositiveIndicators?: string[];
}

export interface MatchDetail {
  field: string;
  screenedValue: string;
  matchedValue: string;
  similarity: number; // 0-100
  algorithm: 'exact' | 'fuzzy' | 'phonetic' | 'translation' | 'transliteration';
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export type ScreeningDecision = 
  | 'CLEAR'              // No matches found
  | 'FALSE_POSITIVE'     // Matches are likely false positives
  | 'PENDING_REVIEW'     // Requires manual review
  | 'APPROVED_WITH_COND' // Approved with conditions
  | 'BLOCKED';           // Transaction blocked

// Mock Sanctions Data for Testing (Sample entries - NOT real sanctions)
export const MOCK_SANCTIONS_DATA: SanctionEntity[] = [
  {
    id: 'MOCK-001',
    names: [{ fullName: 'Ahmed Ben Hassan', script: 'Latin', originalScriptName: 'أحمد بن حسان' }],
    aliases: ['A. Hassan', 'Ben H. Ahmed'],
    nationality: 'DZ',
    address: [{
      address: '123 Rue Didouche Mourad',
      city: 'Alger',
      country: 'Algeria',
      countryIso2: 'DZ',
    }],
    identification: [{ type: 'passport', number: 'DZ1234567', country: 'DZ' }],
    sanctions: [{
      type: 'asset_freeze',
      listName: 'Test List',
      effectiveDate: '2024-01-01',
      basis: 'Mock entry for testing purposes only',
    }],
    lastUpdated: '2024-01-15',
    source: 'INTERNAL_WATCH',
  },
  {
    id: 'MOCK-002',
    names: [{ fullName: 'Global Trading Corp Ltd', script: 'Latin' }],
    aliases: ['GTC Ltd', 'Global Trade Co.'],
    address: [{
      address: '45 Business Park',
      city: 'Dubai',
      country: 'UAE',
      countryIso2: 'AE',
    }],
    identification: [{ type: 'registration_number', number: 'ABC123456', country: 'AE' }],
    sanctions: [{
      type: 'trade_embargo',
      listName: 'Test List',
      effectiveDate: '2024-02-01',
      basis: 'Mock entry for testing purposes only',
    }],
    lastUpdated: '2024-02-15',
    source: 'INTERNAL_WATCH',
  },
  {
    id: 'MOCK-003',
    names: [{ fullName: 'Mohammed El Amine Khelifi', script: 'Latin', originalScriptName: 'محمد الأمين خليفي' }],
    aliases: ['M.A. Khelifi', 'Khelifi M.E.'],
    dateOfBirth: '1985-06-15',
    nationality: 'DZ',
    address: [{
      address: '78 Boulevard Mohamed V',
      city: 'Oran',
      country: 'Algeria',
      countryIso2: 'DZ',
    }],
    sanctions: [{
      type: 'asset_freeze',
      listName: 'Internal Watchlist',
      effectiveDate: '2024-03-01',
      basis: 'Mock entry for testing - suspicious activity pattern',
    }],
    lastUpdated: '2024-03-10',
    source: 'INTERNAL_WATCH',
  },
];

// Screening Engine Functions
export function performScreening(
  entity: ScreenedEntityInput,
  sanctionsList: SanctionEntity[] = MOCK_SANCTIONS_DATA,
  config: RiskScoreConfig = DEFAULT_RISK_CONFIG
): ScreeningResult {
  const matches: MatchResult[] = [];
  const referenceId = generateScreeningRef();

  for (const sanctionedEntity of sanctionsList) {
    const matchResult = compareEntities(entity, sanctionedEntity, config);
    
    if (matchResult.confidenceScore >= config.matchThresholds.lowConfidence) {
      matches.push(matchResult);
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidenceScore - a.confidenceScore);

  // Calculate overall risk
  const overallRiskScore = matches.length > 0
    ? Math.max(...matches.map(m => m.riskScore))
    : 0;

  const riskLevel = determineRiskLevel(overallRiskScore);
  const decision = determineDecision(riskLevel, matches, config);
  const recommendations = generateRecommendations(decision, matches);

  return {
    referenceId,
    screenedEntity: entity,
    timestamp: new Date().toISOString(),
    matches,
    overallRiskScore,
    riskLevel,
    decision,
    recommendations,
  };
}

function compareEntities(
  screened: ScreenedEntityInput,
  sanctioned: SanctionEntity,
  config: RiskScoreConfig
): MatchResult {
  const matchDetails: MatchDetail[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  // Name matching (primary identifier)
  const nameMatch = calculateSimilarity(screened.fullName, sanctioned.names[0]?.fullName || '');
  if (nameMatch > 50) {
    matchDetails.push({
      field: 'fullName',
      screenedValue: screened.fullName,
      matchedValue: sanctioned.names[0].fullName,
      similarity: nameMatch,
      algorithm: 'fuzzy',
    });
    weightedSum += nameMatch * config.weightFactors.nameMatch;
    totalWeight += config.weightFactors.nameMatch;
  }

  // Alias matching
  if (sanctioned.aliases) {
    for (const alias of sanctioned.aliases) {
      const aliasSim = calculateSimilarity(screened.fullName, alias);
      if (aliasSim > 60) {
        matchDetails.push({
          field: 'alias',
          screenedValue: screened.fullName,
          matchedValue: alias,
          similarity: aliasSim,
          algorithm: 'fuzzy',
        });
        weightedSum += aliasSim * config.weightFactors.aliasMatch;
        totalWeight += config.weightFactors.aliasMatch;
        break;
      }
    }
  }

  // DOB matching
  if (screened.dateOfBirth && sanctioned.dateOfBirth) {
    const dobMatch = screened.dateOfBirth === sanctioned.dateOfBirth ? 100 : 0;
    if (dobMatch === 100) {
      matchDetails.push({
        field: 'dateOfBirth',
        screenedValue: screened.dateOfBirth,
        matchedValue: sanctioned.dateOfBirth,
        similarity: 100,
        algorithm: 'exact',
      });
      weightedSum += dobMatch * config.weightFactors.dobMatch;
      totalWeight += config.weightFactors.dobMatch;
    }
  }

  // ID Number matching
  if (screened.idNumber && sanctioned.identification) {
    for (const id of sanctioned.identification) {
      if (screened.idNumber === id.number) {
        matchDetails.push({
          field: 'idNumber',
          screenedValue: screened.idNumber,
          matchedValue: id.number,
          similarity: 100,
          algorithm: 'exact',
        });
        weightedSum += 100 * config.weightFactors.idNumberMatch;
        totalWeight += config.weightFactors.idNumberMatch;
        break;
      }
    }
  }

  // Calculate scores
  const confidenceScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  
  // Get highest sanction severity weight
  const sanctionWeight = Math.max(...sanctioned.sanctions.map(s => 
    config.sanctionSeverityWeights[s.type] || 50
  ));
  
  const riskScore = Math.round((confidenceScore * sanctionWeight) / 100);
  const riskLevel = determineRiskLevel(riskScore);

  // False positive indicators
  const falsePositiveIndicators = assessFalsePositives(screened, sanctioned, matchDetails);

  return {
    matchedEntity: sanctioned,
    matchDetails,
    confidenceScore,
    riskScore,
    riskLevel,
    sources: [sanctioned.source],
    falsePositiveIndicators,
  };
}

function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 90;

  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

function levenshteinDistance(s1: string, s2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

function determineRiskLevel(score: number): RiskLevel {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 25) return 'low';
  return 'none';
}

function determineDecision(
  riskLevel: RiskLevel,
  matches: MatchResult[],
  config: RiskScoreConfig
): ScreeningDecision {
  if (matches.length === 0) return 'CLEAR';
  
  const topMatch = matches[0];
  
  // Critical/high confidence exact match = block
  if (topMatch.confidenceScore >= config.matchThresholds.exactMatch && 
      (riskLevel === 'critical' || riskLevel === 'high')) {
    return 'BLOCKED';
  }

  // High confidence but potential false positive
  if (topMatch.confidenceScore >= config.matchThresholds.highConfidence &&
      topMatch.falsePositiveIndicators && topMatch.falsePositiveIndicators.length > 0) {
    return 'PENDING_REVIEW';
  }

  // Medium confidence requires review
  if (topMatch.confidenceScore >= config.matchThresholds.mediumConfidence) {
    return 'PENDING_REVIEW';
  }

  // Low confidence likely false positive
  return 'FALSE_POSITIVE';
}

function generateRecommendations(
  decision: ScreeningDecision,
  matches: MatchResult[]
): string[] {
  switch (decision) {
    case 'BLOCKED':
      return [
        'DO NOT PROCEED with this transaction',
        'Escalate to Compliance Officer immediately',
        'Document the screening result and block reason',
        'Consider filing Suspicious Activity Report (SAR)',
      ];
    case 'PENDING_REVIEW':
      return [
        'Hold transaction pending manual review',
        'Request additional documentation from entity',
        'Perform enhanced due diligence (EDD)',
        'Review match details with senior compliance staff',
      ];
    case 'FALSE_POSITIVE':
      return [
        'Document reasons for false positive determination',
        'Add to approved entities list if appropriate',
        'Proceed with standard due diligence',
      ];
    case 'APPROVED_WITH_COND':
      return [
        'Apply enhanced monitoring conditions',
        'Set periodic review schedule',
        'Document conditions applied',
      ];
    case 'CLEAR':
    default:
      return [
        'Standard processing may proceed',
        'Retain screening record for audit trail',
      ];
  }
}

function assessFalsePositives(
  screened: ScreenedEntityInput,
  sanctioned: SanctionEntity,
  details: MatchDetail[]
): string[] {
  const indicators: string[] = [];

  // Common name check
  const commonNames = ['mohamed', 'ahmed', 'ali', 'company', 'trading', 'international'];
  const screenedParts = screened.fullName.toLowerCase().split(' ');
  for (const part of screenedParts) {
    if (commonNames.includes(part) && details[0]?.similarity < 90) {
      indicators.push('Common name component');
      break;
    }
  }

  // Different country indicator
  if (screened.countryOfResidence && sanctioned.address?.[0]?.countryIso2) {
    if (screened.countryOfResidence !== sanctioned.address[0].countryIso2) {
      indicators.push('Different country of residence');
    }
  }

  // Only partial match without supporting identifiers
  if (details.length === 1 && details[0].field === 'fullName' && details[0].similarity < 80) {
    indicators.push('Single partial name match only');
  }

  return indicators;
}

function generateScreeningRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SCR-${timestamp}-${random}`;
}

// Case Management Types
export interface ScreeningCase {
  id: string;
  screeningReferenceId: string;
  entity: ScreenedEntityInput;
  result: ScreeningResult;
  status: CaseStatus;
  assignedTo?: string;
  reviewerNotes?: ReviewNote[];
  resolution?: ResolutionInfo;
  createdAt: string;
  updatedAt: string;
  escalated?: boolean;
}

export type CaseStatus = 
  | 'open'
  | 'under_review'
  | 'pending_info'
  | 'escalated'
  | 'resolved_cleared'
  | 'resolved_blocked'
  | 'resolved_false_positive'
  | 'closed';

export interface ReviewNote {
  author: string;
  timestamp: string;
  content: string;
  attachments?: string[];
}

export interface ResolutionInfo {
  resolvedBy: string;
  resolvedAt: string;
  decision: ScreeningDecision;
  justification: string;
  supportingDocs?: string[];
}

// Statistics and Reporting
export interface ScreeningStats {
  periodStart: string;
  periodEnd: string;
  totalScreenings: number;
  clearCount: number;
  pendingReviewCount: number;
  blockedCount: number;
  falsePositiveCount: number;
  averageProcessingTime: number; // minutes
  topMatchCountries: { country: string; count: number }[];
  topSanctionTypes: { type: SanctionType; count: number }[];
}
