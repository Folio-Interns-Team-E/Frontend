// Parses the semi-structured ICP text produced by the backend ICP agent
// (see Backend_Sales_Sync-main/app/ai/icp_agent.py) into a typed object the
// dashboard can render as separate category cards. Falls back gracefully
// when the text doesn't match the expected schema (e.g. legacy free-text
// ICPs saved before this format existed).

export interface BuyerPersona {
  title: string;
  department: string;
  seniority: string;
  decisionMaker: boolean;
}

export interface ParsedICP {
  industries: string[];
  employeesMin?: string;
  employeesMax?: string;
  revenueMin?: string;
  revenueMax?: string;
  countries: string[];
  states: string[];
  cities: string[];
  buyerPersonas: BuyerPersona[];
  painPoints: string[];
  businessGoals: string[];
  buyingTriggers: string[];
  valueProposition: string[];
  techStack: string[];
  disqualifiers: string[];
  keywords: string[];
  notes: string[];
}

const TOP_KEYS = [
  "Firmographics",
  "Buyer_Personas",
  "Pain_Points",
  "Business_Goals",
  "Buying_Triggers",
  "Value_Proposition",
  "Tech_Stack",
  "Disqualifiers",
  "Keywords",
  "Notes",
] as const;

function splitTopSections(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/);
  const buckets: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Za-z_]+):\s*$/);
    if (match && (TOP_KEYS as readonly string[]).includes(match[1])) {
      current = match[1];
      buckets[current] = [];
      continue;
    }
    if (current) buckets[current].push(line);
  }
  const result: Record<string, string> = {};
  for (const key of Object.keys(buckets)) result[key] = buckets[key].join("\n");
  return result;
}

function bulletList(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith("- ") ? line.slice(2) : line))
    .map((line) => line.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

/** Grabs the lines between `startKey:` and the first of `endKeys:` (or end of text). */
function extractBetween(text: string, startKey: string, endKeys: string[]): string {
  const lines = text.split(/\r?\n/);
  const startIdx = lines.findIndex((line) => line.trim() === `${startKey}:`);
  if (startIdx === -1) return "";
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (endKeys.some((key) => trimmed === `${key}:`)) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx + 1, endIdx).join("\n");
}

function extractValue(text: string, key: string): string | undefined {
  if (!text) return undefined;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    const match = trimmed.match(new RegExp(`^${key}:\\s*(.+)$`, "i"));
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}

function parseBuyerPersonas(text?: string): BuyerPersona[] {
  if (!text) return [];
  const personas: BuyerPersona[] = [];
  let current: BuyerPersona | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const titleMatch = line.match(/^-\s*Title:\s*(.+)$/i);
    if (titleMatch) {
      if (current) personas.push(current);
      current = { title: titleMatch[1].trim(), department: "", seniority: "", decisionMaker: false };
      continue;
    }
    if (!current) continue;
    const deptMatch = line.match(/^Department:\s*(.+)$/i);
    if (deptMatch) {
      current.department = deptMatch[1].trim();
      continue;
    }
    const seniorityMatch = line.match(/^Seniority:\s*(.+)$/i);
    if (seniorityMatch) {
      current.seniority = seniorityMatch[1].trim();
      continue;
    }
    const dmMatch = line.match(/^Decision_Maker:\s*(.+)$/i);
    if (dmMatch) {
      current.decisionMaker = /true/i.test(dmMatch[1]);
      continue;
    }
  }
  if (current) personas.push(current);
  return personas;
}

/** Returns null when the text doesn't look like the structured ICP schema at all. */
export function parseICP(raw: string): ParsedICP | null {
  if (!raw || !raw.trim()) return null;
  const top = splitTopSections(raw);
  if (Object.keys(top).length === 0) return null;

  const firmographics = top["Firmographics"] || "";
  const companySize = extractBetween(firmographics, "Company_Size", ["Geography"]);
  const employees = extractBetween(companySize, "Employees", ["Revenue"]);
  const revenue = extractBetween(companySize, "Revenue", []);
  const geography = extractBetween(firmographics, "Geography", []);

  return {
    industries: bulletList(extractBetween(firmographics, "Industries", ["Company_Size", "Geography"])),
    employeesMin: extractValue(employees, "Min"),
    employeesMax: extractValue(employees, "Max"),
    revenueMin: extractValue(revenue, "Min"),
    revenueMax: extractValue(revenue, "Max"),
    countries: bulletList(extractBetween(geography, "Countries", ["States", "Cities"])),
    states: bulletList(extractBetween(geography, "States", ["Cities"])),
    cities: bulletList(extractBetween(geography, "Cities", [])),
    buyerPersonas: parseBuyerPersonas(top["Buyer_Personas"]),
    painPoints: bulletList(top["Pain_Points"]),
    businessGoals: bulletList(top["Business_Goals"]),
    buyingTriggers: bulletList(top["Buying_Triggers"]),
    valueProposition: bulletList(top["Value_Proposition"]),
    techStack: bulletList(top["Tech_Stack"]),
    disqualifiers: bulletList(top["Disqualifiers"]),
    keywords: bulletList(top["Keywords"]),
    notes: bulletList(top["Notes"]),
  };
}

export function isEmptyParsedICP(icp: ParsedICP): boolean {
  return (
    icp.industries.length === 0 &&
    !icp.employeesMin &&
    !icp.employeesMax &&
    !icp.revenueMin &&
    !icp.revenueMax &&
    icp.countries.length === 0 &&
    icp.states.length === 0 &&
    icp.cities.length === 0 &&
    icp.buyerPersonas.length === 0 &&
    icp.painPoints.length === 0 &&
    icp.businessGoals.length === 0 &&
    icp.buyingTriggers.length === 0 &&
    icp.valueProposition.length === 0 &&
    icp.techStack.length === 0 &&
    icp.disqualifiers.length === 0 &&
    icp.keywords.length === 0 &&
    icp.notes.length === 0
  );
}