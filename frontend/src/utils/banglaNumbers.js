export const toBanglaDigits = (num, lang = 'bn') => {
  if (num === null || num === undefined) return '';
  if (lang === 'en') return String(num);
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => banglaDigits[+w]);
};

export const formatBDT = (amount, lang = 'bn') => {
  if (amount === null || amount === undefined) return lang === 'en' ? 'BDT 0' : '৳ ০';
  const numStr = Math.round(amount).toLocaleString('en-IN');
  if (lang === 'en') {
    return `BDT ${numStr}`;
  }
  return `৳ ${toBanglaDigits(numStr, 'bn')}`;
};

export const formatLandArea = (bigha, lang = 'bn') => {
  const bighaNum = parseFloat(bigha) || 0;
  const decimalNum = Math.round(bighaNum * 33 * 10) / 10;
  if (lang === 'en') {
    return {
      bighaText: `${bighaNum} Bigha`,
      decimalText: `${decimalNum} Decimals`,
      fullText: `${bighaNum} Bigha (${decimalNum} Decimals)`
    };
  }
  return {
    bighaText: `${toBanglaDigits(bighaNum, 'bn')} বিঘা`,
    decimalText: `${toBanglaDigits(decimalNum, 'bn')} শতক`,
    fullText: `${toBanglaDigits(bighaNum, 'bn')} বিঘা (${toBanglaDigits(decimalNum, 'bn')} শতক)`
  };
};
