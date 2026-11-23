import sources from './licensed-image-sources.json' with {type:'json'};
import {escape} from '../assets/storefront-ui.mjs';

export function modelImageCredit(slug, image) {
  const source = sources[slug];
  if (!source || image !== `/images/store/licensed/${slug}-720.webp`) return '';
  if (!source.terms) {
    return '<p class="product-image-credit">Model reference image courtesy of Neostore. Colour and physical condition may vary by unit.</p>';
  }
  return `<p class="product-image-credit">Model reference image. Colour and physical condition may vary by unit. <a href="${escape(source.source)}">${escape(source.title)}</a> by ${escape(source.author)} · <a href="${escape(source.terms)}">${escape(source.licence)}</a>. Adapted for display in WebP.</p>`;
}
