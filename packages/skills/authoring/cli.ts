import { generateRegistry } from "./generator.js";

const args = process.argv.slice(2);
try {
  if (args.length !== 1 || !["--write", "--check"].includes(args[0] ?? ""))
    throw new Error("Usage: registry generation requires --write or --check.");
  await generateRegistry({ check: args[0] === "--check" });
  process.stdout.write(
    "Skill registry " + (args[0] === "--check" ? "is fresh." : "generated.") + "\n",
  );
} catch (error) {
  process.stderr.write(
    (error instanceof Error ? error.message : "Skill registry generation failed.") + "\n",
  );
  process.exitCode = 1;
}
