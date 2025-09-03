"use client";

import { useEffect } from "react";

import { useRouter } from "@/i18n/routing";
import { paths, QUERY_PARAMS } from "@/lib/paths";

import { clearCheckoutCookieAction } from "../actions";

export const CheckoutRemover = ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [QUERY_PARAMS.orderPlaced]: string };
}) => {
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      if (QUERY_PARAMS.orderPlaced in searchParams) {
        const { id } = params;

        await clearCheckoutCookieAction();

        // After clearing the checkout cookie, we remove the `?orderPlaced=true` query param
        // to prevent the action from being triggered again on page reload.
        router.replace(paths.order.confirmation.asPath({ id }));
      }
    })();
  }, []);

  return null;
};
