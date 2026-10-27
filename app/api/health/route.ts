import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({ok:true,app:"spendwise-vn",authConfigured:Boolean(process.env.NEON_AUTH_BASE_URL&&process.env.NEON_AUTH_COOKIE_SECRET),databaseConfigured:Boolean(process.env.DATABASE_URL),timestamp:new Date().toISOString()});}
