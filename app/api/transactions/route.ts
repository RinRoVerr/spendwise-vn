import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getSql } from "@/lib/db";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
async function currentUser() { const {data,error}=await auth.getSession(); return error || !data?.user ? null : data.user; }
export async function GET() {
 try { const user=await currentUser(); if(!user) return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});
 const sql=getSql(); const rows=await sql.query("SELECT id,type,amount::float8 AS amount,category,description,to_char(occurred_at, 'YYYY-MM-DD') AS occurred_at FROM transactions WHERE user_id=$1 ORDER BY occurred_at DESC,created_at DESC LIMIT 100",[user.id]);
 return NextResponse.json({transactions:rows}); } catch(e) { console.error("transactions GET failed",e); return NextResponse.json({error:"Không thể tải giao dịch. Hãy kiểm tra cấu hình cơ sở dữ liệu."},{status:500}); }
}
export async function POST(request:Request) {
 try { const user=await currentUser(); if(!user) return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401});
 const b=await request.json(); const type=b?.type; const amount=Number(b?.amount); const category=String(b?.category??"").trim().slice(0,60); const description=String(b?.description??"").trim().slice(0,240); const date=String(b?.occurredAt??new Date().toISOString().slice(0,10));
 if(!["income","expense"].includes(type)) return NextResponse.json({error:"Loại giao dịch không hợp lệ."},{status:400});
 if(!Number.isFinite(amount)||amount<=0||amount>1000000000000) return NextResponse.json({error:"Số tiền phải lớn hơn 0."},{status:400});
 if(!category||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) return NextResponse.json({error:"Danh mục hoặc ngày chưa hợp lệ."},{status:400});
 const sql=getSql();
 if(Array.isArray(b?.bulkDates)){
   const rawDates: unknown[] = b.bulkDates;
   const dates: string[] = [...new Set(rawDates.map((v: unknown) => String(v)))];
   if(type!=="expense"||dates.length<1||dates.length>7||dates.some((v)=>!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)||Number.isNaN(Date.parse(v+"T00:00:00Z")))) return NextResponse.json({error:"Danh sách ngày không hợp lệ (tối đa 7 ngày)."}, {status:400});
   const rows=await sql.query("INSERT INTO transactions(user_id,type,amount,category,description,occurred_at) SELECT $1,'expense',$2,$3,$4,d::date FROM unnest($5::text[]) AS d RETURNING id,type,amount::float8 AS amount,category,description,to_char(occurred_at, 'YYYY-MM-DD') AS occurred_at",[user.id,amount,category,description,dates]);
   return NextResponse.json({transactions:rows,count:rows.length},{status:201});
 }
 const rows=await sql.query("INSERT INTO transactions(user_id,type,amount,category,description,occurred_at) VALUES($1,$2,$3,$4,$5,$6::date) RETURNING id,type,amount::float8 AS amount,category,description,to_char(occurred_at, 'YYYY-MM-DD') AS occurred_at",[user.id,type,amount,category,description,date]);
 return NextResponse.json({transaction:rows[0]},{status:201}); } catch(e) { console.error("transactions POST failed",e); return NextResponse.json({error:"Không thể lưu giao dịch. Kiểm tra cấu hình và bảng dữ liệu."},{status:500}); }
}
export async function DELETE(request:Request) {
 try { const user=await currentUser(); if(!user) return NextResponse.json({error:"Vui lòng đăng nhập."},{status:401}); const id=new URL(request.url).searchParams.get("id");
 if(!id||!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({error:"Mã giao dịch không hợp lệ."},{status:400});
 const sql=getSql(); const rows=await sql.query("DELETE FROM transactions WHERE id=$1::uuid AND user_id=$2 RETURNING id",[id,user.id]);
 if(!rows.length) return NextResponse.json({error:"Không tìm thấy giao dịch."},{status:404}); return NextResponse.json({ok:true});
 } catch(e) { console.error("transactions DELETE failed",e); return NextResponse.json({error:"Không thể xóa giao dịch."},{status:500}); }
}