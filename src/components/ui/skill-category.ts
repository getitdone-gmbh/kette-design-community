// Category keys of the `data-skill` colour roles in the theme, shared by Chip (weighted) and Heatmap.
export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'devops-cloud'
  | 'data-ai'
  | 'design-ux'
  | 'mobile'
  | 'security'
  | 'testing-qa'
  | 'infrastructure'
  | 'project-management'
  | 'business-strategy'
  | 'fallback';

// Full class strings so Tailwind's content scan finds every skill category token.
// Dot/fill class per skill category, shared with charts and chips (the library keeps it in skill-tree.tsx).
export const skillCategoryFill: Record<SkillCategory, string> = {
  frontend: 'bg-data-skill-frontend-default',
  backend: 'bg-data-skill-backend-default',
  'devops-cloud': 'bg-data-skill-devops-cloud-default',
  'data-ai': 'bg-data-skill-data-ai-default',
  'design-ux': 'bg-data-skill-design-ux-default',
  mobile: 'bg-data-skill-mobile-default',
  security: 'bg-data-skill-security-default',
  'testing-qa': 'bg-data-skill-testing-qa-default',
  infrastructure: 'bg-data-skill-infrastructure-default',
  'project-management': 'bg-data-skill-project-management-default',
  'business-strategy': 'bg-data-skill-business-strategy-default',
  fallback: 'bg-data-skill-fallback-default',
};
