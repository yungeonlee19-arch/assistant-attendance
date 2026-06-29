import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {

  const { data: staffList } = await supabase
    .from("staff")
    .select("*");

  if (!staffList || staffList.length === 0) {
    return NextResponse.json({ message: "스태프 없음" });
  }

  const list = staffList;

  function getStaffId(name: string) {
    return list.find((s) => s.name.trim() === name)?.id;
  }

  const fixedSchedule: { day: number; name: string; branch: string }[] = [
    { day: 1, name: "박태양", branch: "강남" },
    { day: 1, name: "박시현", branch: "신촌" },
    { day: 2, name: "이태희", branch: "신촌" },
    { day: 3, name: "김창민", branch: "강남" },
    { day: 3, name: "황서현", branch: "신촌" },
    { day: 4, name: "김현태", branch: "신촌" },
    { day: 5, name: "석호연", branch: "강남" },
    { day: 5, name: "이태희", branch: "신촌" },
  ];

  const today = new Date();
  const schedules = [];

  for (let i = 0; i < 28; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split("T")[0];

    for (const item of fixedSchedule) {
      if (item.day === dayOfWeek) {
        const staffId = getStaffId(item.name);
        if (staffId) {
          schedules.push({
            staff_id: staffId,
            date: dateStr,
            start_time: "18:00:00",
            branch: item.branch,
          });
        }
      }
    }
  }

  const { error } = await supabase
    .from("schedule")
    .insert(schedules);

  if (error) {
    return NextResponse.json({ message: "에러", error: error.message });
  }

  return NextResponse.json({ message: "완료", count: schedules.length });
}