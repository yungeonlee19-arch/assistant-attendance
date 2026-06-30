import { NextResponse } from "next/server";
import CoolsmsMessageService from "coolsms-node-sdk";
import { supabase } from "@/lib/supabase";

const messageService = new CoolsmsMessageService(
  process.env.COOLSMS_API_KEY!,
  process.env.COOLSMS_API_SECRET!
);

function getKoreaTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

function toHHMM(date: Date) {
  return (
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0") +
    ":00"
  );
}

export async function GET() {

  const koreaNow = getKoreaTime();

  const rangeStart = new Date(koreaNow.getTime() + 25 * 60 * 1000);
  const rangeEnd = new Date(koreaNow.getTime() + 35 * 60 * 1000);

  const todayStr = koreaNow.toISOString().split("T")[0];

  const { data: schedules } = await supabase
    .from("schedule")
    .select("*, staff(*)")
    .eq("date", todayStr)
    .gte("start_time", toHHMM(rangeStart))
    .lte("start_time", toHHMM(rangeEnd));

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({
      message: "알림 대상 없음",
      rangeStart: toHHMM(rangeStart),
      rangeEnd: toHHMM(rangeEnd),
    });
  }

  const { data: alreadySent } = await supabase
    .from("sms_log")
    .select("schedule_id")
    .eq("date", todayStr);

  const sentIds = new Set((alreadySent || []).map((r) => r.schedule_id));

  let sentCount = 0;

  for (const schedule of schedules) {

    if (sentIds.has(schedule.id)) continue;

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

      await supabase.from("sms_log").insert([
        {
          schedule_id: schedule.id,
          date: todayStr,
        },
      ]);

      sentCount++;
    }
  }

  return NextResponse.json({ message: "발송 완료", count: sentCount });
}