"use client";

import React from "react";

import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Create the query client
const queryClient = new QueryClient();

// Move config inside a component to ensure it runs on client side
const Providers = ({ children }) => {
  // Initialize config inside the component
  const config = getDefaultConfig({
    appName: "NGO Connect",
    projectId: "41749156dc7fd29140cf03a45b01d243",
    chains: [sepolia],
    ssr: true,
  });

  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={[sepolia]}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
};

export default Providers;
