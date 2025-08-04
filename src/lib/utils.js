import { clsx } from 'clsx';

// Simple tailwind class merger - replaces tailwind-merge to avoid ESM issues
function simpleTwMerge(classString) {
  if (!classString) return '';
  
  const classes = classString.split(' ').filter(Boolean);
  const classMap = new Map();
  
  // Simple deduplication - later classes override earlier ones
  classes.forEach(cls => {
    // Extract base class (e.g., 'text' from 'text-red-500')
    const baseClass = cls.split('-')[0];
    if (!classMap.has(baseClass)) {
      classMap.set(baseClass, []);
    }
    classMap.get(baseClass).push(cls);
  });
  
  // Keep only the last class for each base type
  const mergedClasses = [];
  classMap.forEach(classList => {
    mergedClasses.push(classList[classList.length - 1]);
  });
  
  return mergedClasses.join(' ');
}

export function cn(...inputs) {
  const classString = clsx(inputs);
  return simpleTwMerge(classString);
}
