'use client';

import { CircleUserRound, ShieldLock } from 'lucide-react';

import Link from 'next/link';

import { useState} from 'react';

import { useRouter } from 'next/navigation';


export default function LoginPage() {

  const router = useRouter();

  const [firstName, setFirstName] =useState('');

  const [phone, setPhone] = useState('');

  const [loginError, setLoginError] = useState('');


  async function handleParticipantLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setLoginError('');

    try {

      const response = await fetch('http://localhost:3001/api/participant-login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            first_name: firstName,
            phone: phone
          })
        }
      );


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ||'Unable to login');
      }

      /*
       * Backend returns the fleet ID belonging
       * to the identified participant.
       */

      console.log('Full login response:', data);

      console.log('Participant:', data.participant);
      
      console.log('Fleet ID:', data.participant?.id_fleet);
      
      localStorage.setItem('participantAccessToken', data.accessToken);

      router.push(`/my-device/${data.participant.id_fleet}`);

    } catch (error) {
      console.error('Participant login failed:', error);

      if (error instanceof Error) {

        setLoginError(`שגיאה בכניסה: ${error.message}`);

      } else {

        setLoginError(
          'אירעה שגיאה לא צפויה'
        );
      }
    }
  }


  return (

    <main dir="rtl" className=" min-h-screen bg-slate-100 flex
        items-center justify-center px-6 py-12">

      <div className="w-full max-w-4xl">

        {/* HEADER */}

        <div className="text-center mb-10">

          <p className=" text-red-600 font-semibold mb-2">
            כניסה למערכת
          </p>

          <h1 className=" text-4xl font-bold mb-4">
            איך תרצו להיכנס?
          </h1>

          <p className=" text-slate-600 max-w-2xl mx-auto">

            משתמשים רשומים יכולים לבדוק
            את מצב הדפיברילטור או מכשיר ה-LoRa
            שלהם ולהשלים את הגדרת המכשיר.
          </p>

        </div>

        {/*LOGIN OPTIONS */}

        <div
          className=" grid md:grid-cols-2 gap-6 items-stretch">


          {/*  PARTICIPANT  */}
          <div
            className=" bg-white border border-slate-200
              rounded-2xl p-8 shadow-sm">

            <div className=" flex justify-center mb-5">

              <CircleUserRound color="#dc2626"
                size={70}
                style={{
                  filter:
                    'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.3))'
                }}
              />

            </div>

            <h2 className=" text-center text-2xl font-bold mb-3">
              ניהול המכשיר שלי
            </h2>


            <p className=" text-slate-600 leading-7 mb-6 text-center">
              הזינו את השם הפרטי ומספר
              הטלפון איתם נרשמתם למיזם.
            </p>

            <form onSubmit={handleParticipantLogin} className="space-y-4">

              {/* First name */}

              <div>

                <label className=" block font-medium mb-1">
                  שם פרטי
                </label>

                <input required type="text" value={firstName}
                 onChange={(e) =>
                 setFirstName(e.target.value)}
                  className=" w-full border border-slate-300 rounded-lg
                    px-3 py-2 focus:outline-none focus:ring-2
                    focus:ring-red-300"/>

              </div>

              {/* Phone */}

              <div>

                <label className=" block font-medium mb-1">
                  מספר טלפון
                </label>


                <input required type="tel" value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)}
                  className=" w-full border border-slate-300
                    rounded-lg px-3 py-2 focus:outline-none
                    focus:ring-2 focus:ring-red-300"/>
              </div>

              {/* Error */}

              {loginError && (
                <div className=" bg-red-50 border border-red-200
                    text-red-700 rounded-lg px-3 py-2 text-sm">
                  {loginError}
                </div>

              )}

              <button type="submit" className=" w-full bg-red-600
                  hover:bg-red-700 text-white rounded-lg
                   py-3 font-bold transition">
                כניסה לניהול המכשיר
              </button>


            </form>

          </div>

          {/* ADMIN */}

          <div
            className=" bg-slate-950 text-white border
              border-slate-800 rounded-2xl p-8 shadow-sm flex
              flex-col">

            <div className=" flex justify-center mb-5">
              <ShieldLock size={70} color="#ffffff"/>
            </div>

            <h2
              className=" text-2xl font-bold mb-3 text-center">
              כניסת מנהל מערכת
            </h2>

            <p
              className=" text-slate-300 leading-7 mb-6 text-center">
              ניהול משתמשים, מכשירים,
              תוכן שיווקי, הגדרות מערכת
              ואירועים.
            </p>

            <Link
                href="/admin/login"
              className=" mt-auto bg-slate-800 text-slate-400
                rounded-lg py-3 text-center font-bold">
              כניסת מנהל
            </Link>
          </div>
        </div>



        {/*  BACK HOME */}

        <div className="text-center mt-10">

          <Link href="/"
            className=" text-slate-500 hover:text-slate-800
              font-medium">
            חזרה לדף הבית
          </Link>

        </div>
      </div>
    </main>

  );

}