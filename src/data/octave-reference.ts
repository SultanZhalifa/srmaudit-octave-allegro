/** OCTAVE Allegro reference data: impact areas (step 1) and container types (step 3). */
import type { ContainerType, ImpactArea } from '@/core/types';

export const IMPACT_AREAS: readonly ImpactArea[] = [
  {
    id: 'reputation',
    name: 'Reputation & Customer Confidence',
    description: 'Effect on organizational image and stakeholder trust',
  },
  { id: 'financial', name: 'Financial', description: 'Direct and indirect financial losses' },
  {
    id: 'productivity',
    name: 'Productivity',
    description: 'Impact on business operations and service delivery',
  },
  { id: 'safety', name: 'Safety & Health', description: 'Impact on physical safety of people' },
  {
    id: 'legal',
    name: 'Legal & Regulatory',
    description: 'Fines, penalties, and legal consequences',
  },
];

export const CONTAINER_TYPES: readonly ContainerType[] = [
  {
    id: 'technical',
    name: 'Technical',
    examples: [
      'Database Server',
      'Web Server',
      'Cloud Storage',
      'File Server',
      'Application',
      'Network Device',
    ],
  },
  {
    id: 'physical',
    name: 'Physical',
    examples: [
      'Filing Cabinet',
      'Office',
      'Server Room',
      'Printed Documents',
      'USB Drive',
      'Backup Tapes',
    ],
  },
  {
    id: 'people',
    name: 'People',
    examples: [
      'IT Administrator',
      'Developer',
      'End User',
      'Manager',
      'Third-Party Vendor',
      'Contractor',
    ],
  },
];
