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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);


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




  function getKoreaDateString() {

    const now = new Date();

    return now.toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });

  }




  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {

    const file = e.target.files?.[0];

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));

  }




  async function checkIn() {


    if(!selectedStaff){

      alert("조교를 선택해주세요");
      return;

    }


    if(!photoFile){

      alert("출근 사진을 촬영해주세요");
      return;

    }


    setUploading(true);


    const now = new Date();

    const fileExt = photoFile.name.split(".").pop();

    const fileName = `${selectedStaff}_${now.getTime()}.${fileExt}`;


    const { error: uploadError } = await supabase

      .storage

      .from("attendance-photos")

      .upload(fileName, photoFile);


    if(uploadError){

      alert("사진 업로드 실패");

      console.log(uploadError);

      setUploading(false);

      return;

    }


    const { data: publicUrlData } =

      supabase

      .storage

      .from("attendance-photos")

      .getPublicUrl(fileName);


    const photoUrl = publicUrlData.publicUrl;



    const { error } = await supabase

      .from("attendance")

      .insert([

        {

          staff_id: selectedStaff,

          date: getKoreaDateString(),

          check_in: now.toISOString(),

          status: "출근",

          photo_url: photoUrl

        }

      ]);




    if(error){

      alert("출근 실패");

      console.log(error);

      setUploading(false);

      return;

    }


    setUploading(false);

    setPhotoFile(null);

    setPhotoPreview(null);

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



        <p className="mb-2">

          출근 사진 촬영

        </p>


        <input

          type="file"

          accept="image/*"

          capture="environment"

          onChange={handlePhotoChange}

          className="w-full border p-3 rounded-lg mb-3"

        />


        {

          photoPreview && (

            <img

              src={photoPreview}

              alt="미리보기"

              className="w-full h-48 object-cover rounded-lg mb-5"

            />

          )

        }




        <button

          onClick={checkIn}

          disabled={uploading}

          className="w-full bg-black text-white py-3 rounded-xl disabled:bg-gray-400"

        >

          {uploading ? "업로드 중..." : "출근 체크"}

        </button>



      </div>


    </main>

  );

}