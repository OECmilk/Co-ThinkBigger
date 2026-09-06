import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // プリフェッチ（<Link> がバックグラウンドで投げるリクエスト）では
  // セッション更新は不要。ここで抜けることで、リンクをホバー／表示した
  // だけで Auth API への往復が発生するのを防ぐ。
  if (request.headers.get('next-router-prefetch') === '1') {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() は毎回 Auth API への HTTPS 往復が発生するため使わない。
  // middleware の役割は「期限切れが近いトークンの更新」だけなので、
  // Cookie から読むだけで済み、期限切れ時のみリフレッシュを行う
  // getSession() で十分。
  // （実際の認可チェックは layout / page 側の getUser() が担当する）
  await supabase.auth.getSession()

  return response
}
