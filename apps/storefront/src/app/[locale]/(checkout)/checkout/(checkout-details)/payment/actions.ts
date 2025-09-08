"use server";

import { getLocale } from "next-intl/server";

import { type AllCountryCode } from "@nimara/domain/consts";
import { type Checkout } from "@nimara/domain/objects/Checkout";
import { err } from "@nimara/domain/objects/Result";

import { getAccessToken } from "@/auth";
import { redirect } from "@/i18n/routing";
import { getCheckoutId } from "@/lib/actions/cart";
import { updateCheckoutAddressAction } from "@/lib/actions/update-checkout-address-action";
import { schemaToAddress } from "@/lib/address";
import { paths, QUERY_PARAMS } from "@/lib/paths";
import { checkoutService } from "@/services/checkout";
import { storefrontLogger } from "@/services/logging";
import { userService } from "@/services/user";

import { type Schema } from "./schema";

export async function updateBillingAddress({
  checkout,
  input: { sameAsShippingAddress, billingAddress, saveAddressForFutureUse },
}: {
  checkout: Checkout;
  input: Pick<
    Schema,
    "sameAsShippingAddress" | "billingAddress" | "saveAddressForFutureUse"
  >;
}) {
  const result = await updateCheckoutAddressAction({
    checkoutId: checkout.id,
    address: sameAsShippingAddress
      ? checkout.shippingAddress!
      : schemaToAddress(billingAddress!),
    type: "billing",
  });

  if (saveAddressForFutureUse) {
    const accessToken = await getAccessToken();

    await userService.accountAddressCreate({
      accessToken,
      input: {
        ...billingAddress,
        country: billingAddress?.country as AllCountryCode,
      },
      type: "BILLING",
    });
  }

  return result;
}

/**
 * Server action that creates an order from the current checkout and redirects to the order confirmation page.
 */
export const orderCreate = async () => {
  const checkoutId = await getCheckoutId();

  if (!checkoutId) {
    storefrontLogger.error("Checkout not found while creating an order", {
      checkoutId,
    });

    return err([
      {
        code: "CHECKOUT_NOT_FOUND_ERROR",
      },
    ]);
  }

  const [locale, resultOrderCreate] = await Promise.all([
    getLocale(),
    checkoutService.orderCreate({ id: checkoutId }),
  ]);

  if (resultOrderCreate.ok) {
    redirect({
      href: paths.order.confirmation.asPath({
        id: resultOrderCreate.data.orderId,
        query: { [QUERY_PARAMS.orderPlaced]: "true" },
      }),
      locale,
    });
  }

  storefrontLogger.error("Order creation from checkout failed", {
    checkoutId,
    message: resultOrderCreate.errors.map((e) => e.message).join(", "),
  });

  return err([
    {
      code: "CHECKOUT_COMPLETE_ERROR",
    },
  ]);
};
