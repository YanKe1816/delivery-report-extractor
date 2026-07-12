export type SectionName =
  | "summary"
  | "changed_files"
  | "implemented_items"
  | "fixed_items"
  | "tests"
  | "notes";

const SECTION_ALIASES: Record<string, SectionName> = {
  summary: "summary",
  changes: "changed_files",
  "changed files": "changed_files",
  "modified files": "changed_files",
  files: "changed_files",
  implemented: "implemented_items",
  implementation: "implemented_items",
  "implemented items": "implemented_items",
  fixed: "fixed_items",
  fixes: "fixed_items",
  "fixed items": "fixed_items",
  tests: "tests",
  testing: "tests",
  notes: "notes",
};

export function parseSections(text: string): Record<SectionName, string[]> {
  const sections = emptySections();
  let currentSection: SectionName | null = null;

  for (const rawLine of normalizeNewlines(text).split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const heading = getHeading(line);
    if (heading) {
      currentSection = heading.name;
      if (heading.inlineValue) {
        sections[currentSection].push(cleanItem(heading.inlineValue));
      }
      continue;
    }

    if (currentSection) {
      sections[currentSection].push(cleanItem(line));
    }
  }

  return dedupeSections(sections);
}

function emptySections(): Record<SectionName, string[]> {
  return {
    summary: [],
    changed_files: [],
    implemented_items: [],
    fixed_items: [],
    tests: [],
    notes: [],
  };
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

function getHeading(line: string): { name: SectionName; inlineValue: string } | null {
  const match = line.match(/^#{0,6}\s*([A-Za-z][A-Za-z /_-]{0,40})\s*:\s*(.*)$/);

  if (!match) {
    return null;
  }

  const normalized = match[1].toLowerCase().replace(/[_-]+/g, " ").trim();
  const name = SECTION_ALIASES[normalized];

  if (!name) {
    return null;
  }

  return {
    name,
    inlineValue: match[2].trim(),
  };
}

export function cleanItem(value: string): string {
  return value
    .replace(/^\s*[-*+]\s+/, "")
    .replace(/^\s*\d+[.)]\s+/, "")
    .trim();
}

function dedupeSections(
  sections: Record<SectionName, string[]>,
): Record<SectionName, string[]> {
  const deduped = emptySections();

  for (const sectionName of Object.keys(sections) as SectionName[]) {
    const seen = new Set<string>();

    for (const item of sections[sectionName]) {
      if (!item || seen.has(item)) {
        continue;
      }

      seen.add(item);
      deduped[sectionName].push(item);
    }
  }

  return deduped;
}
