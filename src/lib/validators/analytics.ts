import { z } from "zod";

export const provider_demographics_query_schema = z
  .object({
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
  })
  .refine(
    (data) =>
      !data.start_date || !data.end_date || data.end_date >= data.start_date,
    {
      message: "end_date must be greater than or equal to start_date",
      path: ["end_date"],
    },
  );
