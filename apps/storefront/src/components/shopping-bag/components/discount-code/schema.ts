import { z } from "zod";

import { type GetTranslations } from "@/types";

export const promoCodeValidationSchema = ({ t }: { t: GetTranslations }) =>
  z.object({
    promoCodes: z
      .array(
        z.object({
          id: z.string(),
          displayCode: z.string().trim(),
        }),
      )
      .optional(),
    code: z
      .string()
      .min(1, { message: t("form-validation.typeTheDiscount") })
      .trim(),
  });

export type PromoCodeFormSchema = z.infer<
  ReturnType<typeof promoCodeValidationSchema>
>;
