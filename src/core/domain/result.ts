export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, any> => ({ ok: true, value });
export const err = <E>(error: E): Result<any, E> => ({ ok: false, error });

export async function wrap<T>(promise: Promise<T>): Promise<Result<T>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
