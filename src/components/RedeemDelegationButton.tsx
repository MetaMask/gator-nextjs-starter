"use client";

import { usePimlicoUtils } from "@/hooks/usePimlicoUtils";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useStorageClient from "@/hooks/useStorageClient";
import { prepareRedeemDelegationData } from "@/utils/delegationUtils";
import { getDeleGatorEnvironment } from "@metamask/delegation-toolkit";
import { useState } from "react";
import { Hex } from "viem";
import { optimism } from "viem/chains";

export default function RedeemDelegationButton() {
  const { smartAccount } = useDelegateSmartAccount();
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<Hex | null>(null);
  const chain = optimism;
  const { getDelegation } = useStorageClient();
  const { bundlerClient, paymasterClient, pimlicoClient } =
    usePimlicoUtils();

  const handleRedeemDelegation = async () => {
    if (!smartAccount) return;

    setLoading(true);

    const delegation = getDelegation(smartAccount.address);
    

    if (!delegation) {
      return;
    }

    const redeemData = prepareRedeemDelegationData(delegation);
    const { fast: fee } = await pimlicoClient!.getUserOperationGasPrice();

    const userOperationHash = await bundlerClient!.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          //to: getDeleGatorEnvironment(chain.id).DelegationManager,
          to: smartAccount.address,
          data: redeemData,
        },
      ],
      ...fee,
      paymaster: paymasterClient,
    });

    const { receipt } = await bundlerClient!.waitForUserOperationReceipt({
      hash: userOperationHash,
    });

    setTransactionHash(receipt.transactionHash);

    console.log(receipt);
    setLoading(false);
  };

  if (transactionHash) {
    return (
      <div>
        <button
          className="button"
          onClick={() =>
            window.open(
              `https://optimistic.etherscan.io/tx/${transactionHash}`,
              "_blank"
            )
          }
        >
          View on Etherscan
        </button>
      </div>
    );
  }

  return (
    <button
      className="button"
      onClick={handleRedeemDelegation}
      disabled={loading}
    >
      {loading ? "Redeeming..." : "Redeem Delegation"}
    </button>
  );
}
