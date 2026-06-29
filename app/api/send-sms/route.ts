import { NextResponse } from "next/server";
import CoolsmsMessageService from "coolsms-node-sdk";
import { supabase } from "@/lib/supabase";

const messageService = new CoolsmsMessageService(
  process.env.COOLSMS_API_KEY!,
  process.env.COOLSMS_API_SECRET!
);

export async function GET() {
  const now = new Date();

  const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

  const targetHour = String(thirtyMinutesLater.getHours()).padStart(2, "0");
  const targetMinute = String(thirtyMinutesLater.getMinutes()).padStart(2, "0");

  const { data: schedules } = await supabase
    .from("schedule")
    .select("*, staff(*)")
    .gte("start_time", `${targetHour}:${targetMinute}:00`)
    .lt("start_time", `${targetHour}:${targetMinute}:59`);

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: "알림 대상 없음" });
  }

  for (const schedule of schedules) {
    const staffPhone = schedule.staff?.phone?.trim();
    const staffName = schedule.staff?.name?.trim();
    const branch = schedule.branch;

    if (staffPhone) {
      await messageService.sendOne({
        to: staffPhone,
        from: process.env.COOLSMS_SENDER!,
        text: `[출근 알림] ${staffName}님, 30분 후 ${branch}팀 출근 예정입니다. 준비해주세요!`,
        autoTypeDetect: true,
      });
    }
  }

  return NextResponse.json({ message: "발송 완료" });
}