export interface IUser {
  name: string;
  description?: string;
  price: number;
  stock: number;
  available: boolean;
  createdAt: Date;
  category?: string;
}