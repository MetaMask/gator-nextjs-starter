"use client";

import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { useEffect, useState } from "react";
import { privateKeyToAccount } from "viem/accounts";
import { usePublicClient } from "wagmi";
import { useGatorContext } from "@/hooks/useGatorContext";

export default function useLeafSmartAccount() {
  const { leafWallet } = useGatorContext();
  const publicClient = usePublicClient();

  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
    null
  );

  useEffect(() => {
    console.log(leafWallet);
    if (leafWallet === "0x" || !publicClient) return;

    console.log("Creating smart account");
    const account = privateKeyToAccount(leafWallet as `0x${string}`);

    toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [account.address, [], [], []],
      deploySalt: "0x",
      signatory: { account },
    }).then((smartAccount) => {
      setSmartAccount(smartAccount);
    });
  }, [leafWallet, publicClient]);

  return { smartAccount };
}
