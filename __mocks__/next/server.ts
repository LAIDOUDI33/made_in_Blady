// Mock for Next.js server module
export class NextRequest {
  url: string;
  nextUrl: URL;
  method: string;
  body: any;

  constructor(urlOrRequest: string | URL | any, init?: any) {
    const urlStr = typeof urlOrRequest === 'string' ? urlOrRequest :
                    urlOrRequest instanceof URL ? urlOrRequest.toString() :
                    urlOrRequest?.url || '/';
    this.url = urlStr;
    this.nextUrl = new URL(urlStr, 'https://algeriatrade.dz');
    this.method = init?.method || 'GET';
    this.body = init?.body;
  }

  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
}

export const NextResponse = {
  json: (data: any, init?: any) => ({
    status: init?.status || 200,
    json: () => Promise.resolve(data),
    headers: new Map([['Content-Type', 'application/json']]),
  }),
  redirect: (url: string, init?: number | any) => ({
    status: typeof init === 'number' ? init : 302,
    headers: new Map([['Location', url]]),
  }),
  next: () => ({
    status: 200,
    headers: new Map([['x-middleware-next', '1']]),
  }),
};
