import * as z from "zod/v4";

export const regexString = z.string().check(
  z.refine((v) => {
    try {
      new RegExp(v);
      return true;
    } catch {
      return false;
    }
  }, "Invalid regular expression"),
);
