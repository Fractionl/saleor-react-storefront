import { createFetch } from "@/checkout-storefront/lib/auth/createFetch";
import { useMemo, useState } from "react";
import { Client, ClientOptions, createClient } from "urql";

// since urql doesn't support invalidating cache manually
// https://github.com/urql-graphql/urql/issues/297#issuecomment-501646761
export const useUrqlClient = (opts: ClientOptions) => {
  const authFetch = useMemo(() => createFetch(opts.url), [opts.url]);

  const createNewClient = () =>
    createClient({
      ...opts,
      suspense: true,
      requestPolicy: "cache-first",
      fetch: authFetch,
    });

  const [client, setClient] = useState<Client>(createNewClient());

  const resetClient = () => setClient(createNewClient());

  return { client, resetClient };
};