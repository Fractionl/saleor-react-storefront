import {
  useCheckoutUpdateState,
  useCheckoutUpdateStateActions,
} from "@/checkout-storefront/state/updateStateStore";
import {
  useCheckoutValidationActions,
  useCheckoutValidationState,
} from "@/checkout-storefront/state/checkoutValidationStateStore";
import { useCallback, useEffect, useState } from "react";
import { useCheckoutFinalize } from "@/checkout-storefront/sections/CheckoutForm/useCheckoutFinalize";
import { useAuthState } from "@saleor/sdk";

export const useCheckoutSubmit = () => {
  const { user } = useAuthState();
  const { validateAllForms } = useCheckoutValidationActions();
  const { validating, validationState } = useCheckoutValidationState();
  const { updateState, loadingCheckout } = useCheckoutUpdateState();
  const { setShouldRegisterUser } = useCheckoutUpdateStateActions();
  const { checkoutFinalize, finalizing } = useCheckoutFinalize();

  const [submitInProgress, setSubmitInProgress] = useState(false);

  const submitInitialize = useCallback(() => {
    setSubmitInProgress(true);
    setShouldRegisterUser(true);

    // only guest forms should be validated here
    if (!user) {
      validateAllForms();
    }
  }, [setShouldRegisterUser, user, validateAllForms]);

  const updateStateValues = Object.values(updateState);

  const anyRequestsInProgress =
    updateStateValues.some((status) => status === "loading") || loadingCheckout;

  const finishedApiChangesWithNoError =
    !anyRequestsInProgress && updateStateValues.every((status) => status === "success");

  const allFormsValid =
    !validating && Object.values(validationState).every((value) => value === "valid");

  const handleSubmit = useCallback(async () => {
    if (submitInProgress && finishedApiChangesWithNoError && allFormsValid) {
      void checkoutFinalize();
      return;
    }

    if (!anyRequestsInProgress) {
      setSubmitInProgress(false);
    }
  }, [
    submitInProgress,
    finishedApiChangesWithNoError,
    allFormsValid,
    anyRequestsInProgress,
    checkoutFinalize,
  ]);

  useEffect(() => void handleSubmit(), [handleSubmit]);

  return {
    handleSubmit: submitInitialize,
    isProcessing: (submitInProgress && anyRequestsInProgress) || finalizing,

    validateAllForms,
    allFormsValid,
  };
};