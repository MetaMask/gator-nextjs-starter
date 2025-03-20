"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { lineaSepolia } from "viem/chains";
import { ReactNode } from "react";
import web3AuthConnector from "@/connectors/Web3AuthConnector";
import { metaMask } from "wagmi/connectors";
import { GatorProvider } from "@/providers/GatorProvider";
import { StepProvider } from "@/providers/StepProvider";

export const connectors = [metaMask(), web3AuthConnector([lineaSepolia])];

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [lineaSepolia],
  connectors,
  multiInjectedProviderDiscovery: false,
  transports: {
    [lineaSepolia.id]: http(),
  },
});

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <StepProvider>
          <GatorProvider>{children}</GatorProvider>
        </StepProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
