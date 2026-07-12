export const EXTRACT_DELIVERY_REPORT_INPUT_SCHEMA = {
  type: "object",
  properties: {
    report_text: {
      type: "string",
      description: "Delivery report text to extract.",
    },
    source_label: {
      type: "string",
      description: "Optional label for the source report.",
    },
  },
  required: ["report_text"],
  additionalProperties: false,
} as const;

export const DELIVERY_REPORT_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["success", "error"] },
    summary: { type: "string" },
    changed_files: { type: "array", items: { type: "string" } },
    implemented_items: { type: "array", items: { type: "string" } },
    fixed_items: { type: "array", items: { type: "string" } },
    tests: { type: "array", items: { type: "string" } },
    notes: { type: "array", items: { type: "string" } },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
        },
        required: ["code", "message"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "status",
    "summary",
    "changed_files",
    "implemented_items",
    "fixed_items",
    "tests",
    "notes",
    "errors",
  ],
  additionalProperties: false,
} as const;

export type DeliveryReportError = {
  code: string;
  message: string;
};

export type DeliveryReportOutput = {
  status: "success" | "error";
  summary: string;
  changed_files: string[];
  implemented_items: string[];
  fixed_items: string[];
  tests: string[];
  notes: string[];
  errors: DeliveryReportError[];
};
