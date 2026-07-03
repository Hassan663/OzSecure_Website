'use client';
import {
  Shield,
  ShieldCheck,
  TrafficCone,
  Sparkles,
  HardHat,
  Clock,
  Activity,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Check,
  Star,
  BadgeCheck,
  Users,
  Umbrella,
} from 'lucide-react';

const map = {
  Shield,
  ShieldCheck,
  TrafficCone,
  Sparkles,
  HardHat,
  Clock,
  Activity,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Check,
  Star,
  BadgeCheck,
  Users,
  Umbrella,
};

// Names available to the admin icon picker (kept in sync with `map`).
export const ICON_NAMES = Object.keys(map);

export default function Icon({ name, ...props }) {
  const Cmp = map[name] || Shield;
  return <Cmp {...props} />;
}
