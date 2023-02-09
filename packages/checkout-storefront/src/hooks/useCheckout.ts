import { useEffect, useMemo } from "react";

import { Checkout, useCheckoutQuery } from "@/checkout-storefront/graphql";
import { localeToLanguageCode } from "@/checkout-storefront/lib/utils/locale";
import { useLocale } from "@/checkout-storefront/hooks/useLocale";
import { extractCheckoutIdFromUrl } from "@/checkout-storefront/lib/utils/url";
import { useCheckoutUpdateStateActions } from "@/checkout-storefront/state/updateStateStore";
import { useAuth } from "@/checkout-storefront/lib/auth";

export const useCheckout = ({ pause = false } = {}) => {
  const id = useMemo(() => extractCheckoutIdFromUrl(), []);
  const { locale } = useLocale();
  const { authenticating } = useAuth();
  const { setLoadingCheckout } = useCheckoutUpdateStateActions();

  const [{ data, fetching: loading, stale }, refetch] = useCheckoutQuery({
    variables: { id, languageCode: localeToLanguageCode(locale) },
    pause: pause || authenticating,
  });

  useEffect(() => setLoadingCheckout(loading || stale), [loading, setLoadingCheckout, stale]);

  return { checkout: data?.checkout as Checkout, loading: loading || stale, refetch };
};
