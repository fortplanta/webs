import { describe, it, expect } from 'vitest';
import { calculateConnectionStrength } from './connections';
import { Fragment, Connector } from '../api/types';

function makeFragment(overrides: Partial<Fragment> & { id: string; clusterId: string; type: Fragment['type'] }): Fragment {
  return {
    x: 0, y: 0,
    layout: 'vertical-flow',
    title: overrides.id,
    slots: [],
    createdAtZoom: 0.7,
    starred: false,
    ...overrides,
  };
}

function makeEdge(sourceId: string, targetId: string): Connector {
  return { id: `edge-${sourceId}-${targetId}`, sourceId, targetId, type: 'standard', label: '' };
}

describe('calculateConnectionStrength', () => {
  it('returns 1 for same cluster', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster1', type: 'thesis' });
    // thesis bonus applies, but base is 1 → 1+1 = 2
    // Wait: both in same cluster — but b is thesis, so +1 → 2
    // This test checks the base case without thesis
    const c = makeFragment({ id: 'c', clusterId: 'cluster1', type: 'concept' });
    const d = makeFragment({ id: 'd', clusterId: 'cluster1', type: 'source' });
    expect(calculateConnectionStrength(c, d, [])).toBe(1);
  });

  it('returns 2 for different cluster, same type', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'concept' });
    expect(calculateConnectionStrength(a, b, [])).toBe(2);
  });

  it('returns 3 for different cluster, different type', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'source' });
    expect(calculateConnectionStrength(a, b, [])).toBe(3);
  });

  it('thesis bonus: same cluster + thesis → 2', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster1', type: 'thesis' });
    expect(calculateConnectionStrength(a, b, [])).toBe(2);
  });

  it('thesis bonus: different cluster, different type + thesis → 3 (already max)', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'thesis' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'source' });
    expect(calculateConnectionStrength(a, b, [])).toBe(3);
  });

  it('thesis bonus: different cluster, same type + thesis → 3', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'thesis' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'thesis' });
    // base: different cluster, same type → 2; thesis +1 → 3
    expect(calculateConnectionStrength(a, b, [])).toBe(3);
  });

  it('pre-existing AI edge caps strength at 2', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'source' });
    const edge = makeEdge('cluster1', 'cluster2');
    // base would be 3 (different clusters, different types), capped to 2
    expect(calculateConnectionStrength(a, b, [edge])).toBe(2);
  });

  it('pre-existing AI edge cap is bidirectional', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'source' });
    const edge = makeEdge('cluster2', 'cluster1');
    expect(calculateConnectionStrength(a, b, [edge])).toBe(2);
  });

  it('pre-existing AI edge cap + thesis → 3', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'thesis' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster2', type: 'source' });
    const edge = makeEdge('cluster1', 'cluster2');
    // base 3 → capped to 2 → thesis +1 → 3
    expect(calculateConnectionStrength(a, b, [edge])).toBe(3);
  });

  it('pre-existing edge does not affect same-cluster strength', () => {
    const a = makeFragment({ id: 'a', clusterId: 'cluster1', type: 'concept' });
    const b = makeFragment({ id: 'b', clusterId: 'cluster1', type: 'source' });
    // edge between cluster1 and cluster2 is irrelevant
    const edge = makeEdge('cluster1', 'cluster2');
    expect(calculateConnectionStrength(a, b, [edge])).toBe(1);
  });
});
