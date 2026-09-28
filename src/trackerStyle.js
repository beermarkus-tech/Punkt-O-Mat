import { Apple, Coffee, Droplet, Footprints, Heart, Leaf, Moon, Pill } from 'lucide-react'

// Fixed choice lists, spec.md §7.3.
export const TRACKER_ICONS = {
  droplet: { Icon: Droplet, label: 'Tropfen' },
  apple: { Icon: Apple, label: 'Apfel' },
  pill: { Icon: Pill, label: 'Tablette' },
  coffee: { Icon: Coffee, label: 'Kaffee' },
  footprints: { Icon: Footprints, label: 'Schritte' },
  moon: { Icon: Moon, label: 'Mond' },
  leaf: { Icon: Leaf, label: 'Blatt' },
  heart: { Icon: Heart, label: 'Herz' },
}

export const TRACKER_COLORS = {
  green: { hex: '#2E6F4E', label: 'Grün' },
  orange: { hex: '#C2410C', label: 'Orange' },
  blue: { hex: '#2563EB', label: 'Blau' },
  purple: { hex: '#7C3AED', label: 'Lila' },
}

export const trackerIcon = (key) => (TRACKER_ICONS[key] ?? TRACKER_ICONS.droplet).Icon
export const trackerColor = (key) => (TRACKER_COLORS[key] ?? TRACKER_COLORS.green).hex
