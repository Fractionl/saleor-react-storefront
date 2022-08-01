import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { Contact, ContactSkeleton } from "@/checkout-storefront/sections/Contact";
import {
  DeliveryMethods,
  DeliveryMethodsSkeleton,
} from "@/checkout-storefront/sections/DeliveryMethods";
import { AddressesSkeleton } from "@/checkout-storefront/sections/Addresses";
import { useErrorMessages } from "@/checkout-storefront/hooks/useErrorMessages";
import { useValidationResolver } from "@/checkout-storefront/lib/utils";
import { Suspense, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { object, string } from "yup";
import { Button } from "@/checkout-storefront/components/Button";
import { useCheckoutFinalize } from "./useCheckoutFinalize";
import { FormData } from "./types";
import { useFormattedMessages } from "@/checkout-storefront/hooks/useFormattedMessages";
import { useAuthState } from "@saleor/sdk";
import { useSetFormErrors } from "@/checkout-storefront/hooks/useSetFormErrors";
import { usePaymentMethods } from "../PaymentMethods/usePaymentMethods";
import { PaymentMethods } from "../PaymentMethods";
import { PaymentProviderID } from "checkout-common";
import invariant from "ts-invariant";
import { ShippingAddressSection } from "../Addresses/ShippingAddressSection";
import { CountrySelectProvider } from "@/checkout-storefront/providers/CountrySelectProvider";
import { CountryCode } from "@/checkout-storefront/graphql";

export const CheckoutForm = () => {
  const formatMessage = useFormattedMessages();
  const { errorMessages } = useErrorMessages();
  const { checkout, loading } = useCheckout();
  const { authenticating } = useAuthState();
  const { checkoutFinalize, submitting, errors: userRegisterErrors } = useCheckoutFinalize();

  const isLoading = loading || authenticating;
  const usePaymentProvidersProps = usePaymentMethods(checkout?.channel?.id);
  const { selectedPaymentProvider, selectedPaymentMethod } = usePaymentProvidersProps;
  const [showOnlyContact, setShowOnlyContact] = useState(false);

  const schema = object({
    password: string().required(errorMessages.required),
    email: string().email(errorMessages.invalid).required(errorMessages.required),
  });

  const resolver = useValidationResolver(schema);
  // will be used for e.g. account creation at checkout finalization
  const methods = useForm<FormData>({
    resolver,
    mode: "onBlur",
    defaultValues: { email: checkout?.email || "", createAccount: false },
  });

  useSetFormErrors<FormData>({
    setError: methods.setError,
    errors: userRegisterErrors,
  });

  const { getValues } = methods;

  // not using form handleSubmit on purpose
  const handleSubmit = () => {
    invariant(selectedPaymentProvider);
    invariant(selectedPaymentMethod);

    void checkoutFinalize({
      ...getValues(),
      paymentProviderId: selectedPaymentProvider,
      paymentMethodId: selectedPaymentMethod,
    });
  };

  const payButtonDisabled =
    submitting ||
    (checkout?.isShippingRequired && !checkout?.shippingAddress) ||
    !checkout?.billingAddress ||
    !selectedPaymentProvider;

  return (
    <div className="checkout-form-container">
      <div className="checkout-form">
        <CountrySelectProvider
          selectedCountryCode={checkout?.shippingAddress?.country?.code as CountryCode}
        >
          <FormProvider {...methods}>
            <Suspense fallback={<ContactSkeleton />}>
              <Contact setShowOnlyContact={setShowOnlyContact} />
            </Suspense>
          </FormProvider>
          <>
            {checkout?.isShippingRequired && (
              <Suspense fallback={<AddressesSkeleton />}>
                <ShippingAddressSection collapsed={showOnlyContact} />
              </Suspense>
            )}
            <Suspense fallback={<DeliveryMethodsSkeleton />}>
              <DeliveryMethods collapsed={showOnlyContact} />
            </Suspense>
            <PaymentMethods {...usePaymentProvidersProps} collapsed={showOnlyContact} />
          </>
        </CountrySelectProvider>
      </div>
      {!showOnlyContact &&
        (isLoading ? (
          <Button
            disabled
            ariaLabel={formatMessage("finalizeCheckoutLabel")}
            label={formatMessage("pay")}
            className="pay-button"
          />
        ) : (
          <Button
            disabled={payButtonDisabled}
            ariaLabel={formatMessage("finalizeCheckoutLabel")}
            label={formatMessage("pay")}
            onClick={handleSubmit}
            className="pay-button"
          />
        ))}
    </div>
  );
};
