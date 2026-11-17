// Proceso aparte para @imgly/background-removal-node (lo lanza portadas.ts).
// Va separado porque la librería trae su propio sharp/libvips y, cargado junto al sharp de
// portadas.ts en el mismo proceso, Node se cae. Protocolo: una línea JSON por petición en stdin
// ({ id, input, output }: rutas de PNG) y una línea JSON por respuesta en stdout ({ id, error? }).
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { removeBackground } from "@imgly/background-removal-node";

const lines = createInterface({ input: process.stdin });
for await (const line of lines) {
  if (!line.trim()) continue;
  const { id, input, output } = JSON.parse(line);
  try {
    const png = await readFile(input);
    const blob = await removeBackground(new Blob([png], { type: "image/png" }), {
      model: "medium",
      output: { format: "image/png" },
    });
    await writeFile(output, Buffer.from(await blob.arrayBuffer()));
    process.stdout.write(JSON.stringify({ id }) + "\n");
  } catch (error) {
    process.stdout.write(JSON.stringify({ id, error: String(error?.message ?? error) }) + "\n");
  }
}
