export const COLLECTION_COLORS = [
  '#ff3b30', // red
  '#ff9500', // orange
  '#ffcc00', // yellow
  '#34c759', // green
  '#0071e3', // blue
  '#af52de', // purple
  '#ff2d55', // pink
  '#8e8e93', // gray
];

export const DEFAULT_COLLECTION_COLOR = '#0071e3';

export const COLLECTION_COLOR_NAMES = {
  '#ff3b30': 'Kırmızı',
  '#ff9500': 'Turuncu',
  '#ffcc00': 'Sarı',
  '#34c759': 'Yeşil',
  '#0071e3': 'Mavi',
  '#af52de': 'Mor',
  '#ff2d55': 'Pembe',
  '#8e8e93': 'Gri',
};

export function isValidColor(color) {
  return COLLECTION_COLORS.includes(color);
}
