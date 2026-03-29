import { BenjiConfigError, BenjiApiError } from "benji-sdk";

function isJsonMode(): boolean {
  return process.argv.includes("--json");
}

function formatApiError(error: BenjiApiError): {
  code: string;
  status: number;
  message: string;
  issues?: Array<{ message: string }>;
} {
  return {
    code: error.code,
    status: error.status,
    message: error.message,
    ...(error.issues?.length ? { issues: error.issues } : {}),
  };
}

export function handleCommandError(error: unknown): never {
  const json = isJsonMode();

  if (error instanceof BenjiConfigError) {
    if (json) {
      console.error(
        JSON.stringify({ error: { code: "CONFIG_ERROR", message: error.message } })
      );
    } else {
      console.error(`Error: ${error.message}`);
      console.error("Example: BENJI_API_KEY=your-key benji todos list");
    }
    process.exit(1);
  }

  if (error instanceof BenjiApiError) {
    if (json) {
      console.error(JSON.stringify({ error: formatApiError(error) }));
    } else {
      console.error(`Error [${error.status}] ${error.code}: ${error.message}`);
      if (error.issues?.length) {
        for (const issue of error.issues) {
          console.error(`  - ${issue.message}`);
        }
      }
    }
    process.exit(1);
  }

  const message = error instanceof Error ? error.message : String(error);
  if (json) {
    console.error(
      JSON.stringify({ error: { code: "UNEXPECTED_ERROR", message } })
    );
  } else {
    console.error(`Unexpected error: ${message}`);
  }
  process.exit(1);
}
