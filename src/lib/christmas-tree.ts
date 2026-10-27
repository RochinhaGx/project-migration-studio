export function treeNames(text: string): string[] {
  return text.split(/[\n*]/).map(name => name.trim().toUpperCase()).filter(Boolean).slice(0, 8);
}

export function treeRows(text: string, year: string, size: number) {
  const names = treeNames(text);
  const rows = names.map((text, index) => ({ text, width: (2.4 + index * 1.25) * size, y: (names.length - index) * 1.05 * size, alternate: index % 2 === 1 }));
  if (year.trim()) rows.push({ text: year.trim(), width: 2.8 * size, y: 0, alternate: false });
  return rows;
}