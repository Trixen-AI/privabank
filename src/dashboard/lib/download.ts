/** Saves text as a file in the browser. */
export function download(name: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV with every cell quoted, so commas and quotes in memos never break columns. */
export const csv = (rows: (string | number)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");

/** Reads a user-picked file as text. */
export const readFileText = (file: File) => file.text();
