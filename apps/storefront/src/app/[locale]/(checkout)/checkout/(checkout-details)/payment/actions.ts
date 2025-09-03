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

export const orderCreate = async () => {
  const checkoutId = await getCheckoutId();

  if (!checkoutId) {
    return err([
      {
        code: "CHECKOUT_NOT_FOUND_ERROR",
      },
    ]);
  }

  const locale = await getLocale();
  const resultOrderCreate = await checkoutService.orderCreate({
    id: checkoutId,
  });

  if (resultOrderCreate.ok) {
    redirect({
      href: paths.order.confirmation.asPath({
        id: resultOrderCreate.data.orderId,
        query: { [QUERY_PARAMS.orderPlaced]: "true" },
      }),
      locale,
    });
  }

  return err([
    {
      code: "CHECKOUT_COMPLETE_ERROR",
    },
  ]);
};
