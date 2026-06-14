export interface MacroCardProps {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
  icon: string;
}

export interface ScanResult {
  isFood: boolean;
  foodName: string;
  type: "countable" | "weighable";
  defaultQuantity: number;
  defaultUnit: string;
  defaultGrams: number;
  nutritionPerUnit: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  nutritionPer100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  confidence: string;
  imageUrl: string;
  message?: string;
}

export interface Props {
  mealType: "breakfast" | "lunch" | "dinner" | "custom";
  date: string;
  onClose: () => void;
  onAdded: () => void;
}

export interface MealHistoryItemProps {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  mealType: string;
  createdAt: string;
  onDelete?: () => void;
}
