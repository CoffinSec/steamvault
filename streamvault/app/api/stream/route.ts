import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol')
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Forward range headers for chunked streaming
  const range = req.headers.get('range')
  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (compatible; StreamVault/1.0)',
  }
  if (range) headers['Range'] = range

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers,
      method: 'GET',
    })

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: upstream.status }
      )
    }

    const responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    }

    // Forward important headers
    const forwardHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
    ]
    for (const h of forwardHeaders) {
      const val = upstream.headers.get(h)
      if (val) responseHeaders[h] = val
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}
