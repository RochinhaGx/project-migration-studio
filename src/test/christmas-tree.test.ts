import { describe, expect, it } from 'vitest';
import { treeRows, treeNames } from '@/lib/christmas-tree';
describe('Christmas family tree', () => {
  it('places custom names in their entered order', () => { expect(treeNames('Ana\nDavid*mama*PAPA')).toEqual(['ANA', 'DAVID', 'MAMA', 'PAPA']); });
  it('includes the chosen year underneath the names', () => { expect(treeRows('Ana*David', '2026', 1).at(-1)).toEqual({ text: '2026', width: 2.8, y: 0, alternate: false }); });
  it('omits the year when cleared', () => { expect(treeRows('Ana*David', '', 1).map(r => r.text)).toEqual(['ANA', 'DAVID']); });
});