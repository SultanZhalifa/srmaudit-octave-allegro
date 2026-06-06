import { describe, it, expect } from 'vitest';
import { canAccess, canEdit, isViewOnly } from '@/core/constants';

describe('RBAC', () => {
  it('admin can access and edit data-entry pages', () => {
    expect(canAccess('admin', 'assets')).toBe(true);
    expect(canEdit('admin', 'assets')).toBe(true);
  });

  it('never shows View Only on read-only-by-nature pages (e.g. dashboard)', () => {
    // Regression: dashboard is in nobody's edit list but must NOT be "view only".
    expect(isViewOnly('admin', 'dashboard')).toBe(false);
    expect(isViewOnly('auditor', 'dashboard')).toBe(false);
    expect(isViewOnly('auditee', 'dashboard')).toBe(false);
    expect(isViewOnly('admin', 'compliance')).toBe(false);
    expect(isViewOnly('admin', 'docs')).toBe(false);
  });

  it('shows View Only when a role lacks edit on an editable page', () => {
    // Auditee can view findings but not edit them.
    expect(canAccess('auditee', 'findings')).toBe(true);
    expect(canEdit('auditee', 'findings')).toBe(false);
    expect(isViewOnly('auditee', 'findings')).toBe(true);
  });

  it('does not show View Only when the role can edit the page', () => {
    expect(isViewOnly('admin', 'assets')).toBe(false);
    expect(isViewOnly('auditee', 'evidence')).toBe(false); // auditee can edit evidence
  });

  it('auditee cannot access admin-only pages', () => {
    expect(canAccess('auditee', 'users')).toBe(false);
    expect(canAccess('auditee', 'risk')).toBe(false);
  });
});
