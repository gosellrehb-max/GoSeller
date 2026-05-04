'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import {
  type Product,
  type CheckoutPaymentMethod,
  type CheckoutPaymentPayload,
} from '@/services/api';
import { marketplaceQueryKeys } from '@/features/marketplace/queries/queryKeys';
import { checkoutBuyNow, checkoutCart } from '@/features/marketplace/api/checkout';
import { getProductById } from '@/features/marketplace/api/products';
import { calculatePrices } from '@/utils/productDiscount';
import { readDeliveryLocation } from '@/utils/deliveryLocation';
import { emptyForm, digitsOnly, type FormState, VERIFY_MESSAGES } from '@/features/marketplace/checkout/types/checkoutTypes';

export function useCheckout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyNowProductId = searchParams?.get('buyNow');
  const buyNowQty = Math.max(1, parseInt(searchParams?.get('qty') || '1', 10) || 1);
  const buyNowVariantLabel = searchParams?.get('vl')?.trim() || undefined;

  const { user, isAuthenticated } = useAuth();
  const { cart, isLoading, getCartTotal, loadCart } = useCart() as any;

  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    email: (user as any)?.email ?? '',
  }));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('cod');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [walletPhone, setWalletPhone] = useState('');
  const [paymentVerified, setPaymentVerified] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsgIndex, setVerifyMsgIndex] = useState(0);
  const [verifyDone, setVerifyDone] = useState(false);

  useEffect(() => {
    const loc = readDeliveryLocation();
    if (!loc) return;
    setForm((prev) => {
      if (prev.address.street?.trim()) return prev;
      return {
        ...prev,
        address: {
          ...prev.address,
          street: loc.address,
        },
      };
    });
  }, []);

  const isBuyNow = Boolean(buyNowProductId?.trim());
  const {
    data: buyProductData,
    isLoading: buyProductLoading,
  } = useQuery({
    queryKey: marketplaceQueryKeys.products.detail(buyNowProductId?.trim() || ''),
    enabled: Boolean(buyNowProductId?.trim()),
    queryFn: async () => {
      const res = await getProductById(buyNowProductId!.trim());
      return (res.product ?? null) as Product | null;
    },
  });
  const buyProduct = buyProductData ?? null;

  useEffect(() => {
    if (paymentMethod === 'cod') {
      setPaymentVerified(true);
    } else {
      setPaymentVerified(false);
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod === 'cod') return;
    setPaymentVerified(false);
  }, [cardNumber, cardExpiry, cardCvv, cardName, walletPhone, paymentMethod]);

  const itemCount = useMemo(() => {
    if (isBuyNow) return buyNowQty;
    const items = cart?.items ?? [];
    return items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
  }, [cart, isBuyNow, buyNowQty]);

  const cartTotal = getCartTotal();
  const buyLineTotal = useMemo(() => {
    if (!buyProduct) return 0;
    const unit = calculatePrices(buyProduct).finalPrice;
    const maxStock = Number((buyProduct as any).stock ?? 0);
    const qty = Math.min(buyNowQty, maxStock > 0 ? maxStock : buyNowQty);
    return unit * qty;
  }, [buyProduct, buyNowQty]);

  const total = isBuyNow ? buyLineTotal : cartTotal;

  const onChange = (path: string, value: string) => {
    setForm((prev) => {
      const next: any = { ...prev, address: { ...prev.address } };
      if (path.startsWith('address.')) {
        next.address[path.replace('address.', '')] = value;
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const effectiveBuyQty = useMemo(() => {
    if (!buyProduct) return buyNowQty;
    const maxStock = Number((buyProduct as any).stock ?? 0);
    if (maxStock <= 0) return buyNowQty;
    return Math.min(buyNowQty, maxStock);
  }, [buyProduct, buyNowQty]);

  const canCheckoutCart = isAuthenticated && itemCount > 0 && !isLoading;

  const buyStock = buyProduct ? Number((buyProduct as any).stock ?? 0) : 0;
  const canCheckoutBuy =
    isAuthenticated &&
    !!buyProduct &&
    !buyProductLoading &&
    effectiveBuyQty >= 1 &&
    buyStock > 0 &&
    effectiveBuyQty <= buyStock;

  const canCheckout = isBuyNow ? canCheckoutBuy : canCheckoutCart;
  const affectedProductIds = useMemo(() => {
    if (isBuyNow) {
      const id = buyNowProductId?.trim();
      return id ? [id] : [];
    }
    const items = (cart?.items ?? []) as any[];
    const out = items
      .map((it) => {
        const p = it?.product;
        if (p && typeof p === 'object') return String(p._id ?? p.id ?? '');
        return '';
      })
      .filter(Boolean);
    return out.filter((value, index) => out.indexOf(value) === index);
  }, [isBuyNow, buyNowProductId, cart]);
  const affectedProductIdSet = useMemo(() => new Set(affectedProductIds), [affectedProductIds]);
  const placeOrderMutation = useMutation({
    mutationFn: async ({ payment }: { payment: CheckoutPaymentPayload }) => {
      if (isBuyNow && buyNowProductId) {
        return checkoutBuyNow(
          form,
          buyNowProductId.trim(),
          effectiveBuyQty,
          payment,
          buyNowVariantLabel,
        );
      }
      return checkoutCart(form, payment);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key[0] === marketplaceQueryKeys.products.all[0] &&
            key[1] === 'detail' &&
            typeof key[2] === 'string' &&
            affectedProductIdSet.has(key[2])
          );
        },
      });
      await loadCart();
      setSuccess('Order placed successfully.');
      router.push('/orders');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || err?.message || 'Checkout failed');
    },
  });

  const validateCard = useCallback(() => {
    const num = digitsOnly(cardNumber);
    const exp = cardExpiry.trim();
    const expOk = /^\d{2}\/\d{2}$/.test(exp) || /^\d{2}\/\d{4}$/.test(exp);
    const cvvOk = digitsOnly(cardCvv).length >= 3;
    const nameOk = cardName.trim().length >= 2;
    return num.length >= 12 && expOk && cvvOk && nameOk;
  }, [cardNumber, cardExpiry, cardCvv, cardName]);

  const validateWallet = useCallback(() => digitsOnly(walletPhone).length >= 10, [walletPhone]);

  const buildPaymentPayload = useCallback((): CheckoutPaymentPayload => {
    if (paymentMethod === 'cod') {
      return { method: 'cod' };
    }
    if (paymentMethod === 'card') {
      const num = digitsOnly(cardNumber);
      return { method: 'card', reference: `CARD-****${num.slice(-4)}` };
    }
    const w = digitsOnly(walletPhone);
    return {
      method: paymentMethod,
      reference: `${paymentMethod.toUpperCase()}-${w.slice(-4)}`,
    };
  }, [paymentMethod, cardNumber, walletPhone]);

  const runVerifyAnimation = useCallback(async () => {
    setError(null);
    setVerifyDone(false);
    setVerifying(true);
    setVerifyMsgIndex(0);
    const stepMs = 850;
    const totalMs = 2600;
    const steps = Math.ceil(totalMs / stepMs);
    let i = 0;
    const tick = setInterval(() => {
      i += 1;
      setVerifyMsgIndex((prev) => Math.min(prev + 1, VERIFY_MESSAGES.length - 1));
      if (i >= steps) clearInterval(tick);
    }, stepMs);
    await new Promise((r) => setTimeout(r, totalMs));
    clearInterval(tick);
    setVerifyDone(true);
    await new Promise((r) => setTimeout(r, 900));
    setVerifying(false);
    setVerifyDone(false);
    setPaymentVerified(true);
  }, []);

  const handleVerifyPayment = async () => {
    if (paymentMethod === 'cod') return;
    if (paymentMethod === 'card') {
      if (!validateCard()) {
        setError('Enter a valid card number (12+ digits), expiry (MM/YY), CVV, and name on card.');
        return;
      }
    } else if (!validateWallet()) {
      setError('Enter a valid mobile number for the wallet (at least 10 digits).');
      return;
    }
    setError(null);
    await runVerifyAnimation();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      setError('Please login to continue checkout.');
      return;
    }
    if (!paymentVerified) {
      setError('Verify your payment first (or choose Cash on delivery).');
      return;
    }

    if (isBuyNow) {
      if (!buyNowProductId?.trim() || !buyProduct) {
        setError('Invalid or missing product for Buy now. Go back to the product page.');
        return;
      }
      if (Number((buyProduct as any).stock ?? 0) > 0 && effectiveBuyQty > Number((buyProduct as any).stock ?? 0)) {
        setError('Not enough stock for this quantity.');
        return;
      }
    } else if (!cart?.items?.length) {
      setError('Your cart is empty. Add products before checkout.');
      return;
    }

    const payment = buildPaymentPayload();

    await placeOrderMutation.mutateAsync({ payment });
  };

  const inputClass =
    'w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500';

  const productTitle =
    buyProduct && ((buyProduct as any).title ?? (buyProduct as any).name)
      ? String((buyProduct as any).title ?? (buyProduct as any).name)
      : 'Product';

  const showVerifyOverlay = verifying || verifyDone;
  const submitting = placeOrderMutation.isPending;
  const canPlaceOrder = canCheckout && paymentVerified && !verifying;

  return {
    cart,
    isLoading,
    isAuthenticated,
    buyNowProductId,
    buyNowVariantLabel,
    isBuyNow,
    buyNowQty,
    form,
    submitting,
    error,
    success,
    buyProduct,
    buyProductLoading,
    paymentMethod,
    cardNumber,
    cardExpiry,
    cardCvv,
    cardName,
    walletPhone,
    paymentVerified,
    verifying,
    verifyMsgIndex,
    verifyDone,
    itemCount,
    buyLineTotal,
    total,
    effectiveBuyQty,
    canCheckout,
    inputClass,
    productTitle,
    showVerifyOverlay,
    canPlaceOrder,
    onChange,
    submit,
    handleVerifyPayment,
    setPaymentMethod,
    setCardNumber,
    setCardExpiry,
    setCardCvv,
    setCardName,
    setWalletPhone,
  };
}
