import { Divider } from "@/checkout-storefront/components/Divider";
import {
  AddressFragment,
  CheckoutAddressValidationRules,
  useCheckoutShippingAddressUpdateMutation,
  useUserQuery,
} from "@/checkout-storefront/graphql";
import { useAlerts } from "@/checkout-storefront/hooks/useAlerts";
import { useCheckout } from "@/checkout-storefront/hooks/useCheckout";
import { useErrors, UseErrors } from "@/checkout-storefront/hooks/useErrors";
import { useFormattedMessages } from "@/checkout-storefront/hooks/useFormattedMessages";
import { extractMutationErrors } from "@/checkout-storefront/lib/utils";
import { useAuthState } from "@saleor/sdk";
import React from "react";
import { GuestAddressSection } from "./GuestAddressSection";
import { AddressFormData, CommonSectionProps, UserAddressFormData } from "./types";
import { UserAddressSection } from "./UserAddressSection";
import { getAddressInputData } from "./utils";

export const ShippingAddressSection: React.FC<CommonSectionProps> = ({ collapsed }) => {
  const formatMessage = useFormattedMessages();
  const { user: authUser } = useAuthState();
  const { checkout } = useCheckout();
  const [{ data }] = useUserQuery({
    pause: !authUser?.id,
  });

  const user = data?.me;
  const addresses = user?.addresses;
  const defaultShippingAddress = user?.defaultShippingAddress;
  const { showErrors } = useAlerts();
  const errorProps = useErrors<AddressFormData>();
  const { setApiErrors } = errorProps;

  const defaultAddress = checkout?.shippingAddress || defaultShippingAddress;

  const [, checkoutShippingAddressUpdate] = useCheckoutShippingAddressUpdateMutation();

  const updateShippingAddress = async ({ autoSave = false, ...address }: AddressFormData) => {
    const autoSaveData: CheckoutAddressValidationRules = autoSave
      ? {
          checkRequiredFields: false,
          // checkFieldsFormat
        }
      : {};

    const result = await checkoutShippingAddressUpdate({
      checkoutId: checkout.id,
      shippingAddress: getAddressInputData(address),
      validationRules: autoSaveData,
    });

    const [hasErrors, errors] = extractMutationErrors(result);

    if (hasErrors) {
      showErrors(errors, "checkoutShippingUpdate");
      setApiErrors(errors);
      return;
    }
  };

  if (collapsed) {
    return null;
  }

  return (
    <>
      <Divider />
      <div className="section">
        {authUser ? (
          <UserAddressSection
            {...(errorProps as UseErrors<UserAddressFormData>)}
            title={formatMessage("shippingAddress")}
            type="SHIPPING"
            onAddressSelect={(address) => {
              void updateShippingAddress(address);
            }}
            // @ts-ignore TMP
            addresses={addresses as UserAddressFormData[]}
            defaultAddressId={defaultAddress?.id}
          />
        ) : (
          <GuestAddressSection
            address={checkout?.shippingAddress as AddressFragment}
            title={formatMessage("shippingAddress")}
            onSubmit={(address) => {
              void updateShippingAddress(address);
            }}
            {...errorProps}
          />
        )}
        {/* <Checkbox
        value="useShippingAsBilling"
        checked={isBillingSameAsShippingAddress}
        onChange={setIsBillingSameAsShippingAddress}
        label={formatMessage("useShippingAsBilling")}
      /> */}
      </div>
    </>
  );
};
