import type { DeliveryReportOutput } from "../schemas/delivery_report_schema";
import { parseSections } from "../utils/text_sections";

export type ExtractDeliveryReportInput = {
  report_text: string;
  source_label?: string;
};

export function extractDeliveryReport(
  input: ExtractDeliveryReportInput,
): DeliveryReportOutput {
  if (!input.report_text.trim()) {
    return {
      status: "error",
      summary: "",
      changed_files: [],
      implemented_items: [],
      fixed_items: [],
      tests: [],
      notes: [],
      errors: [
        {
          code: "empty_input",
          message: "Report text cannot be empty.",
        },
      ],
    };
  }

  const sections = parseSections(input.report_text);

  return {
    status: "success",
    summary: sections.summary.join("\n"),
    changed_files: sections.changed_files,
    implemented_items: sections.implemented_items,
    fixed_items: sections.fixed_items,
    tests: sections.tests,
    notes: sections.notes,
    errors: [],
  };
}
