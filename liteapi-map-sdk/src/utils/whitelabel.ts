interface WhitelabelParams {
  hotelId: string;
  checkin: string;
  checkout: string;
  adults: number;
  children?: number[];
  currency?: string;
}

// Docs: https://docs.liteapi.travel/docs/deeplinking-to-whitelabel

export function buildWhitelabelUrl(params: WhitelabelParams): string {
  const WHITELABEL_DOMAIN = 'https://whitelabel.nuitee.link';
  // example: occupancies=W3sicm9vbXMiOjEsImFkdWx0cyI6MiwiY2hpbGRyZW4iOls4LDZd fQ== (adults=2, children ages 8 and 6)
  const occupancies = [
    {
      adults: params.adults,
      ...(params.children && params.children.length > 0 ? { children: params.children } : {}),
    },
  ];
  const encodedOccupancies = btoa(JSON.stringify(occupancies));
  const currency = params.currency || 'USD';

  const url = new URL(`${WHITELABEL_DOMAIN}/hotels/${params.hotelId}`);
  url.searchParams.set('checkin', params.checkin);
  url.searchParams.set('checkout', params.checkout);
  url.searchParams.set('currency', currency);
  url.searchParams.set('occupancies', encodedOccupancies);

  return url.toString();
}
