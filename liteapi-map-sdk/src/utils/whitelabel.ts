interface WhitelabelParams {
  hotelId: string;
  placeId: string;
  checkin: string;
  checkout: string;
  adults: number;
}

export function buildWhitelabelUrl(params: WhitelabelParams): string {
  const WHITELABEL_DOMAIN = 'https://whitelabel.nuitee.link';
  // lp72e2c?placeId=&checkin=2025-10-05&checkout=2025-10-06&rooms=1&adults=2&name=Dubai&occupancies=W3sicm9vbXMiOjEsImFkdWx0cyI6MiwiY2hpbGRyZW4iOltdfV0%3D&trackingId=&language=en&currency=EUR&children=
  // TODO: couples only? (or editable?) - hardcoded 2
  // const occupancies = [{ adults: params.adults }];
  const occupancies = [{ adults: 2 }];
  const encodedOccupancies = btoa(JSON.stringify(occupancies));
  const currency = 'USD'; // hardcoded across the project

  const url = new URL(`${WHITELABEL_DOMAIN}/hotels/${params.hotelId}`);
  url.searchParams.set('placeId', params.placeId);
  url.searchParams.set('checkin', params.checkin);
  url.searchParams.set('checkout', params.checkout);
  url.searchParams.set('currency', currency);
  url.searchParams.set('occupancies', encodedOccupancies);

  return url.toString();
}
