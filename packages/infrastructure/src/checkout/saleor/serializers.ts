import {
  type CheckoutProblems,
  type GiftCard,
} from "@nimara/domain/objects/Checkout";
import { type PriceType } from "@nimara/domain/objects/common";

import { type GiftCardFragment } from "#root/graphql/fragments/generated";
import { serializeMoney } from "#root/store/saleor/serializers";
import { serializeLine } from "#root/utils";

import { type CheckoutProblemsFragment } from "./graphql/fragments/generated";

export const serializeCheckoutProblems = (
  data: CheckoutProblemsFragment[] | null,
  priceType: PriceType,
): CheckoutProblems => {
  if (!data) {
    return {
      insufficientStock: [],
      variantNotAvailable: [],
    };
  }

  return data.reduce<CheckoutProblems>(
    (acc, problem) => {
      switch (problem.__typename) {
        case "CheckoutLineProblemInsufficientStock":
          acc.insufficientStock.push({
            line: serializeLine(problem.line, priceType),
            availableQuantity: problem.availableQuantity,
          });
          break;
        case "CheckoutLineProblemVariantNotAvailable":
          acc.variantNotAvailable.push({
            line: serializeLine(problem.line, priceType),
          });
          break;
        default:
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.error(`Unknown checkout problem type: ${problem}`);

          break;
      }

      return acc;
    },
    {
      insufficientStock: [],
      variantNotAvailable: [],
    },
  );
};

/**
 * Serializes a GraphQL GiftCardFragment from the Saleor API into a GiftCard object.
 * @param data - GiftCardFragment
 * @returns GiftCard
 */
export const serializeGiftCard = (data: GiftCardFragment): GiftCard => ({
  currentBalance: serializeMoney(data.currentBalance),
  displayCode: data.displayCode,
  id: data.id,
  initialBalance: serializeMoney(data.initialBalance),
  last4CodeChars: data.last4CodeChars,
});
