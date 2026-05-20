/**
 * Shared TypeScript types — framework-agnostisch.
 * Darf von Client- und Server-Code importiert werden.
 * Kein Import aus features/ oder components/.
 */

export type UserId = string;
export type ListId = string;
export type ItemId = string;
export type CategoryId = string;

export interface User {
  id: UserId;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface List {
  id: ListId;
  name: string;
  userId: UserId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: ItemId;
  name: string;
  quantity: number;
  unit: string | null;
  checked: boolean;
  note: string | null;
  listId: ListId;
  categoryId: CategoryId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: CategoryId;
  name: string;
  color: string | null;
}

/** Item mit eager-geladenem Category */
export type ItemWithCategory = Item & {
  category: Category | null;
};

/** List mit Items */
export type ListWithItems = List & {
  items: ItemWithCategory[];
};
