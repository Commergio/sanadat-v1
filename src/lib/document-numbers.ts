export interface NextDocumentNumber {
  number: number;
  displayNumber: string;
  displayNumberEn: string;
}

/** Placeholder until P1 calls get_next_document_number RPC with tenant context. */
function placeholderNext(prefixAr: string, prefixEn: string): NextDocumentNumber {
  return {
    number: 1,
    displayNumber: `${prefixAr}-001`,
    displayNumberEn: `${prefixEn}-001`,
  };
}

export function getNextReceiptNumber(): NextDocumentNumber {
  return placeholderNext("قبض", "RCP");
}

export function getNextPaymentNumber(): NextDocumentNumber {
  return placeholderNext("صرف", "PAY");
}
