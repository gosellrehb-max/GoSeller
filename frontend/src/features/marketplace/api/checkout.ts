import {
  ordersAPI,
  type CheckoutPaymentPayload,
  type CheckoutShippingAddress,
} from "@/services/api";

type CheckoutForm = CheckoutShippingAddress;

export async function checkoutCart(
  form: CheckoutForm,
  payment: CheckoutPaymentPayload,
) {
  return ordersAPI.checkout(form, payment);
}

export async function checkoutBuyNow(
  form: CheckoutForm,
  productId: string,
  quantity: number,
  payment: CheckoutPaymentPayload,
  variantLabel?: string,
) {
  return ordersAPI.checkoutBuyNow(
    form,
    productId,
    quantity,
    payment,
    variantLabel,
  );
}
