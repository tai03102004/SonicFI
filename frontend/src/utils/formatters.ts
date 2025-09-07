export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

export const formatNumber = (value: number) => {
  return value.toLocaleString();
};

export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatBalance = (balance: string) => {
  const num = parseFloat(balance);
  return num > 1000 ? `${(num / 1000).toFixed(1)}K` : num.toFixed(2);
};

export const getSentimentColor = (sentiment: number) => {
  if (sentiment > 0.3) return "#10b981"; // Green
  if (sentiment > -0.3) return "#f59e0b"; // Yellow
  return "#ef4444"; // Red
};

export const getSentimentText = (sentiment: number) => {
  if (sentiment > 0.1) return "Bullish";
  if (sentiment < -0.1) return "Bearish";
  return "Neutral";
};
