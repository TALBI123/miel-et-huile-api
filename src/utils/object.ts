export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}
export const filterObjectByKeys = <
  T extends Record<string, any>,
  K extends keyof T
>(
  obj: T,
  list: readonly K[]
): Pick<T, K> => {
  const SetList = new Set(list);
  const objFilterd = {} as Pick<T, K>;
  for (const key of Object.keys(obj ?? {}))
    if (SetList.has(key as K)) objFilterd[key as K] = obj[key];
  return objFilterd;
};
