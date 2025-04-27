import { createContext, useCallback, useState } from "react";
import { Hex } from "viem";
import { generatePrivateKey } from "viem/accounts";

export const GatorContext = createContext({
  delegateWallet: "0x",
  generateDelegateWallet: () => {},

  leafWallet: "0x",
  generateLeafWallet: () => {},
});

export const GatorProvider = ({ children }: { children: React.ReactNode }) => {
  const [delegateWallet, setDelegateWallet] = useState<Hex>("0x");
  const [leafWallet, setLeafWallet] = useState<Hex>("0x");

  const generateDelegateWallet = useCallback(() => {
    const privateKey = generatePrivateKey();
    setDelegateWallet(privateKey);
  }, []);

  const generateLeafWallet = useCallback(() => {
    const privateKey = generatePrivateKey();
    setLeafWallet(privateKey);
  }, []);

  return (
    <GatorContext.Provider value={{ delegateWallet, generateDelegateWallet, leafWallet, generateLeafWallet }}>
      {children}
    </GatorContext.Provider>
  );
};
