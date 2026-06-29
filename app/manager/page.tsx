"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Schedule = {
  id: string;
  staff_id: string;
  start_time: string;
  branch: string;
};

type Staff = {
  id: string;
  name: string;
  branch: string;
};

type Attendance = {
  staff_id: string;
  check_in: string;
};

export default function ManagerPage() {

  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);

  useEffect(() => {

    async function loadData() {

      const today = new Date().toISOString().split("T")[0];

      const { data: scheduleData } =
        await supabase
          .from("schedule")
          .select("*")
          .eq("date", today);

      const { data: staffData } =
        await supabase
          .from("staff")
          .select("*");

      const { data: attendanceData } =
        await supabase
          .from("attendance")
          .select("*");

      setScheduleList(scheduleData || []);
      setStaffList(staffData || []);
      setAttendanceList(attendanceData || []);

    }

    loadData();

  }, []);

  function isLate(time: string) {
    const now = new Date();
    const [hour, minute] = time.split(":").map(Number);
    const start = new Date();
    start.setHours(hour);
    start.setMinutes(minute);
    return now > start;
  }

  function renderTeam(branch: string) {

    const teamSchedule =
      scheduleList.filter((s) => s.branch === branch);

    return (
      <section className="mb-10">

        <h2 className="text-2xl font-bold mb-4">
          {branch}팀
        </h2>

        <div className="grid gap-4">
          {teamSchedule.map((item) => {

            const staff = staffList.find((s) => s.id === item.staff_id);
            const attendance = attendanceList.find((a) => a.staff_id === item.staff_id);
            const late = !attendance && isLate(item.start_time);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow p-5"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {staff?.name}
                    </h3>
                    <p className="text-gray-500">
                      예정 출근 : {item.start_time}
                    </p>
                  </div>

                  {attendance ? (
                    <div className="text-green-600 font-bold">
                      ✅ 출근
                      <p className="text-sm">
                        {new Date(attendance.check_in).toLocaleTimeString()}
                      </p>
                    </div>
                  ) : late ? (
                    <div className="text-orange-600 font-bold">
                      ⚠ 지각 의심
                    </div>
                  ) : (
                    <div className="text-red-600 font-bold">
                      ❌ 미출근
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-3xl font-bold mb-10">
        조교 출근 관리
      </h1>

      {renderTeam("강남")}
      {renderTeam("신촌")}

    </main>
  );
}