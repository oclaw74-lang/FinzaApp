import {
  Utensils,
  Book,
  Film,
  Laptop,
  TrendingUp,
  MoreHorizontal,
  PlusCircle,
  Shirt,
  Briefcase,
  Heart,
  Zap,
  Car,
  ShoppingBag,
  Home,
  Tag,
  Wallet,
  Coffee,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'utensils': Utensils,
  'book': Book,
  'film': Film,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'more-horizontal': MoreHorizontal,
  'plus-circle': PlusCircle,
  'shirt': Shirt,
  'briefcase': Briefcase,
  'heart': Heart,
  'zap': Zap,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'home': Home,
  'wallet': Wallet,
  'coffee': Coffee,
}

export function getCategoriaIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Tag
  return ICON_MAP[name.toLowerCase()] ?? Tag
}
