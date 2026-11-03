import { createField } from './modules/field.js';
import { createGallery } from './modules/gallery.js';
import { createFilters } from './modules/filters.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');
const components = [
  createField(document.querySelector('#field'), { motion }),
  createGallery(document.querySelector('.grid'), { motion }),
  createFilters(document.querySelector('.worlds'), { motion }),
];
addEventListener('pagehide', event => {
  if (!event.persisted) components.forEach(component => component?.destroy());
}, { once: true });
