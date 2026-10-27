import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function currentUser() {
  const { data, error } = await auth.getSession();
  return error || !data?.user ? null : data.user;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const sql = getSql();
    const rows = await sql.query(
      "SELECT b.id, b.category, b.amount::float8 AS amount, to_char(b.month, 'YYYY-MM') AS month, COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)::float8 AS spent FROM budgets b LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category AND date_trunc('month', t.occurred_at) = b.month WHERE b.user_id = $1 AND b.month = date_trunc('month', CURRENT_DATE)::date GROUP BY b.id ORDER BY b.category",
      [user.id]
    );
    return NextResponse.json({ budgets: rows });
  } catch (e) {
    console.error("budgets GET failed", e);
    return NextResponse.json({ error: "Không thể tải ngân sách." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const body = await request.json();
    const category = String(body?.category ?? "").trim().slice(0, 60);
    const amount = Number(body?.amount);
    if (!category) return NextResponse.json({ error: "Vui lòng nhập danh mục." }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000000) {
      return NextResponse.json({ error: "Ngân sách phải lớn hơn 0." }, { status: 400 });
    }
    const sql = getSql();
    const rows = await sql.query(
      "INSERT INTO budgets (user_id, category, month, amount) VALUES ($1, $2, date_trunc('month', CURRENT_DATE)::date, $3) ON CONFLICT (user_id, category, month) DO UPDATE SET amount = EXCLUDED.amount RETURNING id, category, amount::float8 AS amount, to_char(month, 'YYYY-MM') AS month",
      [user.id, category, amount]
    );
    return NextResponse.json({ budget: rows[0] }, { status: 200 });
  } catch (e) {
    console.error("budgets POST failed", e);
    return NextResponse.json({ error: "Không thể lưu ngân sách." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json({ error: "Mã ngân sách không hợp lệ." }, { status: 400 });
    }
    const sql = getSql();
    const rows = await sql.query("DELETE FROM budgets WHERE id = $1::uuid AND user_id = $2 RETURNING id", [id, user.id]);
    if (!rows.length) return NextResponse.json({ error: "Không tìm thấy ngân sách." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("budgets DELETE failed", e);
    return NextResponse.json({ error: "Không thể xóa ngân sách." }, { status: 500 });
  }
}