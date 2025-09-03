"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import type { Checkout } from "@nimara/domain/objects/Checkout";
import { Button } from "@nimara/ui/components/button";
import { Form } from "@nimara/ui/components/form";
import { Spinner } from "@nimara/ui/components/spinner";
import { useToast } from "@nimara/ui/hooks";

import { TextFormField } from "@/components/form/text-form-field";

import { addPromoCode, removePromoCode } from "../../actions";
import { type PromoCodeFormSchema, promoCodeValidationSchema } from "./schema";

type AppliedCode = {
  displayCode: string;
  id?: string;
};

export const DiscountCode = ({ checkout }: { checkout: Checkout }) => {
  const t = useTranslations();
  const { toast } = useToast();
  const [isTransitioning, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldClearInput, setShouldClearInput] = useState(false);

  const appliedCodes: AppliedCode[] = useMemo(() => {
    const codes: AppliedCode[] = [];

    if (checkout?.voucherCode) {
      codes.push({ displayCode: checkout.voucherCode });
    }

    if (checkout?.usedGiftCards?.length) {
      codes.push(
        ...checkout.usedGiftCards.map((card) => ({
          id: card.id,
          displayCode: card.displayCode ?? card.last4CodeChars ?? "",
        })),
      );
    }

    return codes.filter((c) => !!c.displayCode);
  }, [checkout]);

  const form = useForm<PromoCodeFormSchema>({
    resolver: zodResolver(promoCodeValidationSchema({ t })),
    defaultValues: {
      promoCodes: appliedCodes,
      code: "",
    },
  });

  const toggleOpen = () => setIsOpen((v) => !v);

  const isCodeApplied =
    appliedCodes.length > 0 &&
    !form.formState.isSubmitting &&
    !form.formState.isLoading;

  const handleSubmit = async (values: PromoCodeFormSchema) => {
    startTransition(
      () =>
        void (async () => {
          const result = await addPromoCode({
            checkoutId: checkout.id,
            promoCode: values.code,
          });

          if (result.ok) {
            form.reset({ code: "" });
            setIsOpen(false);

            return;
          }

          const isPromoCodeInvalid = result.errors.find(
            (error) => error.code === "INVALID_VALUE_ERROR",
          );

          if (isPromoCodeInvalid) {
            form.setError("code", {
              message: t("errors.DISCOUNT_CODE_NOT_EXIST_ERROR", {
                code: `(${values.code})`,
              }),
            });
            setShouldClearInput(true);

            return;
          }

          // handle "DISCOUNT_CODE_ADD_ERROR"
          const addError = result.errors.find(
            (error) => error.code === "DISCOUNT_CODE_ADD_ERROR",
          );

          if (addError) {
            form.setError("code", {
              message: t("errors.DISCOUNT_CODE_ADD_ERROR", {
                code: `(${values.code})`,
              }),
            });
            setShouldClearInput(true);

            return;
          }

          const notApplicableError = result.errors.find(
            (error) => error.code === "VOUCHER_NOT_APPLICABLE_ERROR",
          );

          if (notApplicableError) {
            form.setError("code", {
              message: t("errors.VOUCHER_NOT_APPLICABLE_ERROR", {
                code: `(${values.code})`,
              }),
            });
            setShouldClearInput(true);

            return;
          }

          toast({
            description: t("errors.UNKNOWN_ERROR"),
            variant: "destructive",
            position: "center",
          });
        })(),
    );
  };

  const handleRemoveCode = async (codeToRemove: AppliedCode) => {
    startTransition(
      () =>
        void (async () => {
          if (!codeToRemove) {
            return;
          }

          const result = await removePromoCode({
            checkoutId: checkout.id,
            promoCode: codeToRemove.id ? undefined : codeToRemove.displayCode,
            promoCodeId: codeToRemove.id,
          });

          if (result.ok) {
            toast({
              description: t("cart.discount-removed"),
              position: "center",
            });
            form.reset({ code: "" });

            return;
          }

          toast({
            description: t("errors.DISCOUNT_CODE_REMOVE_ERROR"),
            variant: "destructive",
            position: "center",
          });
        })(),
    );
  };

  // clear input field after displaying error
  useEffect(() => {
    if (shouldClearInput) {
      const timer = setTimeout(() => {
        form.reset({ code: "" });
        setShouldClearInput(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [shouldClearInput, form]);

  return (
    <>
      <div className="py-4">
        <div className="flex items-center justify-between text-sm text-stone-700">
          <span>
            {t("cart.discount-code", {
              code:
                isCodeApplied && !isTransitioning
                  ? `(${appliedCodes.length})`
                  : null,
            })}
          </span>

          {isTransitioning ? (
            <Spinner className="h-4 w-4 animate-spin" />
          ) : !isOpen ? (
            <span
              className="cursor-pointer text-stone-700 hover:underline"
              onClick={toggleOpen}
            >
              {t("cart.add-discount")}
            </span>
          ) : (
            <span
              className="cursor-pointer text-stone-700 hover:underline"
              onClick={toggleOpen}
            >
              {t("common.close")}
            </span>
          )}
        </div>

        {isOpen && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex gap-2"
              id="promo-code-form"
            >
              <div className="flex-grow">
                <TextFormField
                  name="code"
                  placeholder={t("cart.type-code")}
                  label=""
                />
              </div>
              <Button
                className="mt-2"
                variant="outline"
                type="submit"
                disabled={form.formState.isSubmitting || isTransitioning}
              >
                {t("cart.redeem")}
              </Button>
            </form>
          </Form>
        )}

        {isCodeApplied && (
          <div className="grid">
            {appliedCodes.map((c) => (
              <span
                key={c.displayCode}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span>{c.displayCode}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveCode(c)}
                  aria-label={t("cart.remove-button")}
                  disabled={isTransitioning}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
        )}
      </div>
      <hr className="border-stone-200" />
    </>
  );
};
