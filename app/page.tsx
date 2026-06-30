"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


type Staff = {
  id: string;
  name: string;
  branch: string;
};


export default function Home() {


  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");


  useEffect(() => {

    async function getStaff() {

      const { data, error } = await supabase
        .from("staff")
        .select("*");


      if(error){
        console.log(error);
        return;
      }


      setStaffList(data);

    }


    getStaff();

  }, []);




  function getKoreaTime() {

    const now = new Date();

    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

    const koreaTime = new Date(utc + (9 * 60 * 60000));

    return koreaTime;

  }




  async function checkIn() {


    if(!selectedStaff){

      alert("조교를 선택해주세요");
      return;

    }


    const now = getKoreaTime();



    const { error } = await supabase

      .from("attendance")

      .insert([

        {

          staff_id: selectedStaff,

          date: now.toISOString().split("T")[0],

          check_in: now.toISOString(),

          status: "출근"

        }

      ]);




    if(error){

      alert("출근 실패");

      console.log(error);

      return;

    }



    alert("출근 완료!");

  }




  return (

    <main className="min-h-screen bg-gray-100 flex items-center justify-center">


      <div className="bg-white p-10 rounded-2xl shadow-lg w-96">


        <h1 className="text-2xl font-bold text-center mb-6">

          조교 출근 관리 시스템

        </h1>



        <p className="mb-2">

          조교 선택

        </p>



        <select

          className="w-full border p-3 rounded-lg mb-5"

          value={selectedStaff}

          onChange={(e)=>setSelectedStaff(e.target.value)}

        >


          <option value="">

            선택하세요

          </option>



          {

            staffList.map((staff)=>(


              <option

                key={staff.id}

                value={staff.id}

              >

                {staff.name} ({staff.branch})

              </option>


            ))

          }



        </select>





        <button

          onClick={checkIn}

          className="w-full bg-black text-white py-3 rounded-xl"

        >

          출근 체크

        </button>



      </div>


    </main>

  );

}