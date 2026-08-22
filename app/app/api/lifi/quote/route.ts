import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.LI_FI_API_KEY;
  const routeSecret = process.env.LI_FI_ROUTE_SECRET;
  if (!routeSecret || request.headers.get('x-lifi-route-secret') !== routeSecret) {
    return NextResponse.json({ error: 'LI.FI route is not configured for this caller' }, { status: 401 });
  }
  if (!apiKey) return NextResponse.json({ error: 'LI_FI_API_KEY is not configured' }, { status: 503 });
  try {
    const body = await request.json();
    const response = await fetch('https://api.li.fi/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-lifi-api-key': apiKey },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Unable to request LI.FI quote' }, { status: 502 });
  }
}
