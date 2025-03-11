export const toWei = (amount: string | number): string => {
  return (parseFloat(amount.toString()) * 1e18).toString();
};

export const fromWei = (amountInWei: string | bigint): string => {
  return (Number(amountInWei) / 1e18).toString();
};