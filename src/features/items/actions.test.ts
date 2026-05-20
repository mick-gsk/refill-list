/**
 * Unit Tests für Item-Actions (RL-02, RL-07)
 * Vitest + Prisma-Mock
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeItemName, similarityScore } from '@/shared/models/normalization';
import { computePriority } from '@/shared/models/priority';

describe('normalizeItemName', () => {
  it('sollte lowercase und getrimmt zurückgeben', () => {
    expect(normalizeItemName('  Milch  ')).toBe('milch');
    expect(normalizeItemName('VOLLMILCH')).toBe('vollmilch');
  });

  it('sollte mehrfache Leerzeichen reduzieren', () => {
    expect(normalizeItemName('3,5%  Milch')).toBe('35 milch');
  });

  it('sollte Umlaute behalten', () => {
    expect(normalizeItemName('Spülmittel')).toBe('spülmittel');
    expect(normalizeItemName('Käse')).toBe('käse');
  });
});

describe('similarityScore', () => {
  it('sollte 1 für identische Strings zurückgeben', () => {
    expect(similarityScore('milch', 'milch')).toBe(1);
  });

  it('sollte hohen Score für ähnliche Namen haben', () => {
    const score = similarityScore('milch', 'milsh');
    expect(score).toBeGreaterThan(0.7);
  });

  it('sollte niedrigen Score für ungleiche Namen haben', () => {
    const score = similarityScore('milch', 'waschmittel');
    expect(score).toBeLessThan(0.4);
  });
});

describe('computePriority', () => {
  const now = new Date('2026-05-20T10:00:00Z');

  it('sollte CRITICAL für EMPTY-Status zurückgeben', () => {
    expect(computePriority({ status: 'EMPTY', nextPredictedEmpty: null, priorityOverride: false, priorityOverrideUntil: null }, now)).toBe('CRITICAL');
  });

  it('sollte CRITICAL für abgelaufenes nextPredictedEmpty zurückgeben', () => {
    const yesterday = new Date('2026-05-19T10:00:00Z');
    expect(computePriority({ status: 'OK', nextPredictedEmpty: yesterday, priorityOverride: false, priorityOverrideUntil: null }, now)).toBe('CRITICAL');
  });

  it('sollte SOON für nextPredictedEmpty in 2 Tagen zurückgeben', () => {
    const soon = new Date('2026-05-22T10:00:00Z');
    expect(computePriority({ status: 'OK', nextPredictedEmpty: soon, priorityOverride: false, priorityOverrideUntil: null }, now)).toBe('SOON');
  });

  it('sollte NO_NEED für weit entferntes Datum zurückgeben', () => {
    const far = new Date('2026-06-20T10:00:00Z');
    expect(computePriority({ status: 'OK', nextPredictedEmpty: far, priorityOverride: false, priorityOverrideUntil: null }, now)).toBe('NO_NEED');
  });
});
