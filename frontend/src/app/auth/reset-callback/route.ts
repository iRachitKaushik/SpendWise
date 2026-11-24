import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  const failure = () => NextResponse.redirect(
    new URL("/forgot-password?error=invalid", request.url)
  );

  if (!code) return failure();

  const store = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(values) {
          values.forEach(({ name, value, options }) => {
            store.set(name, value, options);
          });
        }
      }
    }
  );

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) return failure();

  return NextResponse.redirect(
    new URL("/reset-password", request.url)
  );
}
