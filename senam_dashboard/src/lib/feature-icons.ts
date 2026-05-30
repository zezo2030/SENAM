import {
  Award,
  BadgeCheck,
  Clock,
  Handshake,
  Hammer,
  Headphones,
  Leaf,
  Sparkles,
  Star,
  Tag,
  Truck,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface FeatureIconOption {
  id: string;
  ar: string;
  en: string;
  Icon: LucideIcon;
}

export const FEATURE_ICON_OPTIONS: FeatureIconOption[] = [
  { id: 'design', ar: 'تصميم مخصص', en: 'Custom design', Icon: Sparkles },
  { id: 'warranty', ar: 'ضمان على العمل', en: 'Warranty', Icon: BadgeCheck },
  { id: 'pricing', ar: 'أسعار تنافسية', en: 'Competitive pricing', Icon: Tag },
  { id: 'quality', ar: 'جودة عالية', en: 'High quality', Icon: Award },
  { id: 'craftsmanship', ar: 'تنفيذ احترافي', en: 'Professional execution', Icon: Hammer },
  { id: 'consultation', ar: 'استشارة مجانية', en: 'Free consultation', Icon: Headphones },
  { id: 'speed', ar: 'تدخل سريع', en: 'Fast response', Icon: Zap },
  { id: 'delivery', ar: 'توصيل', en: 'Delivery', Icon: Truck },
  { id: 'team', ar: 'فريق متخصص', en: 'Expert team', Icon: Users },
  { id: 'experience', ar: 'خبرة طويلة', en: 'Long experience', Icon: Star },
  { id: 'maintenance', ar: 'صيانة', en: 'Maintenance', Icon: Wrench },
  { id: 'trust', ar: 'التزام', en: 'Reliable', Icon: Handshake },
  { id: 'eco', ar: 'صديق للبيئة', en: 'Eco-friendly', Icon: Leaf },
  { id: 'hours', ar: 'مواعيد مرنة', en: 'Flexible hours', Icon: Clock },
];

const BY_ID = new Map(FEATURE_ICON_OPTIONS.map((o) => [o.id, o]));

export function getFeatureIcon(id: string | undefined | null): FeatureIconOption | null {
  if (!id) return null;
  return BY_ID.get(id) ?? null;
}
