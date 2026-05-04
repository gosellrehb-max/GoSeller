export type CheckoutShippingAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
};

/** Payment choice from checkout UI (mapped to stored PaymentInfo). */
export type CheckoutPaymentInput = {
  method: "cod" | "card" | "jazzcash" | "easypaisa";
  /** Optional client reference after “verification” (e.g. masked txn). */
  reference?: string;
};
