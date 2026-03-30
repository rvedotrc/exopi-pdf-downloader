import { createHash } from "node:crypto";

export default (url: string) => {
  const hash = createHash("sha256");
  hash.update(url);
  return hash.digest().toString("hex");
};
