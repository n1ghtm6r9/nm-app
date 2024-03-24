export interface ICrudUpdateOptions<E> {
  id: string;
  payload: Partial<E>;
}
