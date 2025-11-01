/**
 * Attend que toutes les promesses se terminent.
 * - Renvoie un objet { fulfilled, rejected }.
 * - Si au moins une promesse a échoué, elle rejette avec ce détail.
 */
enum PromiseStatus {
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
}
export type AllWithErrorsError<T> = Error & {
  fulfilled: T[];
  rejected: unknown[];
};

export async function allWithErrors<T>(promises: Promise<T>[]): Promise<T[]> {
  const results = await Promise.allSettled(promises);
  const fulfilled = results
    .filter((r) => r.status === PromiseStatus.FULFILLED)
    .map((r) => r.value);
  const rejected = results
    .filter((r) => r.status === PromiseStatus.REJECTED)
    .map((r) => r.reason);
  if (rejected.length > 0) {
    const error = new Error("Une ou plusieurs promesses ont échoué");
    (error as AllWithErrorsError<T>).fulfilled = fulfilled;
    (error as AllWithErrorsError<T>).rejected = rejected;
    throw error;
  }
  return fulfilled
}
