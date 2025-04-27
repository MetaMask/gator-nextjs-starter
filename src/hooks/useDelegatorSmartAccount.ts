"use client";

import {
  Implementation,
  MetaMaskSmartAccount,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

export default function useDelegatorSmartAccount(): {
  smartAccount: MetaMaskSmartAccount | null;
} {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(
    null
  );

  useEffect(() => {
    if (!address || !walletClient || !publicClient) return;

    console.log("Creating delegate smart account");

    toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [address, [], [], []],
      deploySalt: "0x",
      signatory: { walletClient },
    }).then((smartAccount) => {
      console.info("delegator smart account address: ", smartAccount.address)
      setSmartAccount(smartAccount);
    });
  }, [address, walletClient, publicClient]);

  return { smartAccount };
}
