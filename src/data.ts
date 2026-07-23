export const ITEM_TYPES = ["Homework", "Lab", "Assignment"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export type StudentItem = {
  id: string;
  type: ItemType;
  title: string;
  dueDate: string;
  className?: string;
  week?: number;
  createdAt: string;
};

export type TrackItem = {
  id: string;
  week: number;
  label: string;
  description?: string;
};


