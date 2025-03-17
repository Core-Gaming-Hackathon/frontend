export const toWei = (amount: string | number): bigint => {
  // Convert to string, parse as float, multiply by 10^18, and convert to BigInt
  return BigInt(Math.floor(parseFloat(amount.toString()) * 10**18));
};

export const fromWei = (amountInWei: string | bigint): string => {
  return (Number(amountInWei) / 1e18).toString();
};