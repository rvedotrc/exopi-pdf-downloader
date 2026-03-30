// export const doThrow = (e: Error): never => {
//   throw e;
// };

export const ensureError = (e: unknown): Error => {
  if (e instanceof Error) return e;

  const error = new Error("(wrapping as Error)");
  error.cause = e;
  return error;
};
