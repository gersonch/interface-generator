export interface IUser {
  title: string;
  author: string;
  body: string;
  comments: { body: string; date: Date }[];
  date: Date;
  hidden: boolean;
  meta: { votes: number; favs: number };
  hola: "a" | "b" | "c";
}