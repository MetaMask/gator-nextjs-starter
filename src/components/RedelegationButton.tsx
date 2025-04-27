"use client";

import { usePimlicoUtils } from "@/hooks/usePimlicoUtils";
import useDelegateSmartAccount from "@/hooks/useDelegateSmartAccount";
import useLeafSmartAccount from "@/hooks/useLeafSmartAccount";
import { useGatorContext } from "@/hooks/useGatorContext";
import useStorageClient from "@/hooks/useStorageClient";
import { prepareRedeemDelegationData } from "@/utils/delegationUtils";
import { getDeleGatorEnvironment, getDelegationHashOffchain, createDelegation } from "@metamask/delegation-toolkit";
import { useState } from "react";
import { Hex, zeroAddress } from "viem";
import { optimism } from "viem/chains";


export default function RedelegationButton() {
  const { smartAccount: delegateSmartAccount } = useDelegateSmartAccount();
  const { smartAccount: leafSmartAccount } = useLeafSmartAccount();
  const { generateLeafWallet } = useGatorContext();
  
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<Hex | null>(null);
  const chain = optimism;
  const { getDelegation } = useStorageClient();
  const { bundlerClient, paymasterClient, pimlicoClient } =
    usePimlicoUtils();

  const [signedLeafDelegation, setSignedLeafDelegation] = useState<any | null>(null);

  const handleRedelegationConfig = async () => {
    console.info("redelegation -> check delegate smart account")
    if (!delegateSmartAccount) return;

    
    console.info("redelegation -> check leaf smart account")
    if (!leafSmartAccount) return;

    const delegation = getDelegation(delegateSmartAccount.address);

    if (!delegation) {
      return;
    }

    setLoading(true);

    const { fast: fee } = await pimlicoClient!.getUserOperationGasPrice();


    // deploy the redelegation smart account
    console.info("deploy delegate smart account")
    

    const userOperationHashDelegate = await bundlerClient!.sendUserOperation({
      account: delegateSmartAccount,
      calls: [
        {
          to: zeroAddress,
        },
      ],
      paymaster: paymasterClient,
      ...fee,
    });

    const { receipt: receiptDelegate } = await bundlerClient!.waitForUserOperationReceipt({
      hash: userOperationHashDelegate,
    });
    console.info("deploy delegate smart account receipt: ", receiptDelegate)



    // deploy the leaf smart account
    console.info("deploy leaf smart account")
    

    const userOperationHashLeaf = await bundlerClient!.sendUserOperation({
      account: leafSmartAccount,
      calls: [
        {
          to: zeroAddress,
        },
      ],
      paymaster: paymasterClient,
      ...fee,
    });

    const { receipt: receiptRedeclare } = await bundlerClient!.waitForUserOperationReceipt({
      hash: userOperationHashLeaf,
    });
    console.info("deploy leaf smart account receipt: ", receiptRedeclare)

    // verify that it is deployed
    const isDelegateDeployed = await delegateSmartAccount.isDeployed()
    console.info("is deployed delegate: ", isDelegateDeployed)

    const isLeafDeployed = await leafSmartAccount.isDeployed()
    console.info("is deployed leaf: ", isLeafDeployed)


    // create leafDelegation 
    const parentDelegationHash = getDelegationHashOffchain(delegation);

    const leafDelegation = createDelegation({
      to: leafSmartAccount.address,
      from: delegateSmartAccount.address,
      // You can also choose to pass the parent delegation object, and let function
      // handle the rest.
      parentDelegation: parentDelegationHash,
      caveats: [] // Empty caveats array - we recommend adding appropriate restrictions.
    });

    const signature = await delegateSmartAccount.signDelegation({
      delegation: leafDelegation,
    });

    const signedLeafDelegation = {
      ...leafDelegation,
      signature,
    };

    setSignedLeafDelegation(signedLeafDelegation)

    setLoading(false);
  };

  const handleRedelegationGo = async () => {
    console.info("redelegation -> check delegate smart account")
    if (!delegateSmartAccount) return;

    
    console.info("redelegation -> check leaf smart account")
    if (!leafSmartAccount) return;

    setLoading(true);

    const { fast: fee } = await pimlicoClient!.getUserOperationGasPrice();

    console.info("to delegator manager: ", getDeleGatorEnvironment(chain.id).DelegationManager)
    const redeemData = prepareRedeemDelegationData(signedLeafDelegation);

    //const delegation = getDelegation(delegateSmartAccount.address);
    //const redeemData = prepareRedeemDelegationData(delegation);

    console.info("send user operation")
    console.info("data: ", redeemData)
    const userOperationHash = await bundlerClient!.sendUserOperation({
      account: leafSmartAccount,
      //account: delegateSmartAccount,
      calls: [
        {
          to: getDeleGatorEnvironment(chain.id).DelegationManager,
          data: redeemData,
        },
      ],
      ...fee,
      paymaster: paymasterClient,
    });

    console.info("wait: .........")
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
    <div>
      <button 
        className="button" 
        onClick={generateLeafWallet}
      >
        1. Create Leaf Wallet
      </button>

      <button
        className="button"
        onClick={handleRedelegationConfig}
        disabled={loading}
      >
        {loading ? "Redelegation configuring ..." : "2. Redeem Configuration"}
      </button>
      <button
        className="button"
        onClick={handleRedelegationGo}
        disabled={loading}
      >
        {loading ? "Redelegation going ..." : "3. Redeem Redelegation Go"}
      </button>
    </div>
  );

  
}
