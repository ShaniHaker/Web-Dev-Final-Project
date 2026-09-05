'use client';

import { useEffect, useState } from 'react';
import { Siren, Bike, MapPin, SatelliteDish, MoveLeft, Smartphone } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { describe } from 'node:test';

const FleetMap = dynamic(
  () => import('@/app/FleetMap'),
  { ssr: false }
);

type HomeContent = {
  hero: {
    title: string;
    subtitles: string;
  }

  lora: {
    title: string;
    description: string;
  }

  registration: {
    title: string;
    description: string;
  }
}

const defaultHomeContent: HomeContent = {
  hero: 
  {
    title:'רשת דפיברילטורים חכמה להצלת חיים',
    subtitles: 'מערכת חכמה לחיבור בין דפיברילטורים, מתנדבים ותקשורת LoRa'
  },
  lora: 
  {
    title: 'מהי רשת LoRa?', 
    description: `
טכנולוגיית תקשורת לטווח ארוך ובהספק נמוך
המאפשרת העברת מידע גם באזורים שבהם אין חיבור סלולרי זמין.

באמצעות Meshtastic ניתן לייצר רשת Mesh,
שבה מכשירים מעבירים הודעות זה לזה
ומרחיבים את טווח הקליטה.
    `

  },
  registration: 
  {
    title: 'הצטרפו לרשת',
    description: 'ניתן להצטרף כבעלי דפיברילטור, כמשתתפי LoRa או בשילוב של שניהם.'
  }
};

type FleetItem = {
  id_user: number;
  first_name: string;
  last_name: string;
  phone: string;

  id_fleet: number;
  has_defi: number;
  has_lora: number;
  dev_EUI: string | null;
  med_training: string;
  lora_battery: number | null;
  is_working_defi: number;

  latitude: number | null;
  longitude: number | null;
  time_of_transmit: string | null;
};

type ReigsterationForm = {
  firstName: string;
  lastName: string;
  phone: string;

   participantType: 'DEFIBRILLATOR' | 'LORA' | 'DEFIBRILLATOR_WITH_LORA';
   devEUI: string;
   medicalTraining: string;
}

type Emergency = {
  id_emergency: number;
  latitude: number;
  longitude: number;
  created_at: string;
  status: string;
};

type StationaryDefibrillator = {
  id: number;
  location_name: string;
  location_description: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  street: string | null;
  street_num: string | null;
  floor: string | null;
  location_hours: string | null;
  contact_phone: string | null;
};

export default function Home() {

  const [fleet, setFleet] = useState<FleetItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [emergencies, setEmergencies] = useState<Emergency[]>([]);

  const [selectedEmergencyId, setSelectedEmergencyId] = useState<number | null>(null);

  const [candidates, setCandidates] =useState<FleetItem[]>([]);

  const [form, setForm] = useState<ReigsterationForm>({
    firstName:'', lastName:'', phone:'', participantType:'DEFIBRILLATOR', 
    devEUI:'', medicalTraining:''
  });

  const [homeContent, setHomeContent] = useState<HomeContent>(defaultHomeContent);

   const hasDefi =
    form.participantType === 'DEFIBRILLATOR' ||
    form.participantType === 'DEFIBRILLATOR_WITH_LORA';

  const hasLora = form.participantType === 'LORA' ||
    form.participantType === 'DEFIBRILLATOR_WITH_LORA';

  const [registrationMessage, setRegistrationMessage] = useState('');

  const [stationaryDefibrillators, setStationaryDefibrillators] = 
      useState<StationaryDefibrillator[]>([]);

  useEffect(() => {

    Promise.all([
      fetch(
        'http://localhost:3001/api/fleet/latest-locations'
      ).then((response) => response.json()),

      fetch(
        'http://localhost:3001/api/emergencies/active'
      ).then((response) => response.json()),

      fetch(
        'http://localhost:3001/api/stationary-defibrillators'
      ).then((response) => response.json())
    ])

    .then(([fleetData, emergencyData, stationaryData]) => {

      setFleet(fleetData);
      setEmergencies(emergencyData);
      setStationaryDefibrillators(stationaryData);
      setLoading(false);

    })

    .catch((error) => {

      console.error(
        'Failed to load dashboard:',
        error
      );

      setLoading(false);

    });

  }, []);


  async function handleEmergencySelect(id: number) {

    try {

      const response = await fetch(
        `http://localhost:3001/api/emergencies/${id}/candidates`
      );

      if (!response.ok) {
        throw new Error(
          'Failed to fetch candidates'
        );
      }

      const data = await response.json();

      console.log( 'Candidates returned:', data);

      const candidateList = Array.isArray(data) ? data
                        : Array.isArray(data.candidates) ? data.candidates
                        : [];

      console.log('Candidate list:', candidateList);

    setCandidates(candidateList);
    setSelectedEmergencyId(id);

    } catch (error) {
      console.error('Candidate fetch failed:', error);
    }
  }


  function handleClearEmergencySelection() {
    setSelectedEmergencyId(null);
    setCandidates([]);
  }

  async function handleRegistration(
    event: React.FormEvent<HTMLElement>) 
    { 
       event.preventDefault();

  const registrationData = {
    first_name: form.firstName,
    last_name: form.lastName || null,
    phone: form.phone,

    has_defi: hasDefi,
    has_lora: hasLora,

    dev_EUI:
      hasLora
        ? form.devEUI
        : null,

    med_training:
      form.medicalTraining || null
  };


  try {

    const response = await fetch(
      'http://localhost:3001/api/register',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(registrationData)
      }
    );


    const data = await response.json();


    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }


    setRegistrationMessage('ההרשמה הושלמה בהצלחה!');


    setForm({firstName: '', lastName: '', phone: '',
      participantType: 'DEFIBRILLATOR', devEUI: '', medicalTraining: ''});

  } catch (error) {

    console.error('Registration failed:', error);

  if (error instanceof Error) {
    setRegistrationMessage(
      `אירעה שגיאה בהרשמה: ${error.message}`
    );
  }

    setRegistrationMessage('אירעה שגיאה בהרשמה');
  }

}

useEffect (() => {
  async function loadHomeContent() {
  try {
    const response = await fetch(`
      http://localhost:3002/api/content/home`);

    if(!response.ok) {
      throw new Error('Failed to load homepage content');
    }

    const data = await response.json();

    setHomeContent({
      hero: {
        title: data.hero?.title ?? defaultHomeContent.hero.title,
        subtitles: data.hero.subtitle ?? defaultHomeContent.hero.subtitles
      },
      lora: {
        title: data.lora?.title ?? defaultHomeContent.lora.title,
        description: data.lora?.description ?? defaultHomeContent.lora.description
      },
      registration:
      {
        title: data.registration?.title ?? defaultHomeContent.registration.title,
        description: data.registration?.description ?? defaultHomeContent.registration.description
      }
    });
  } // try
  catch(error) {
    console.error('Homepage content failed to load', error);
  }
  }
  loadHomeContent();
}, []);


  /*
   * Small statistics for dashboard.
   */
  const defibrillators =
    fleet.filter((item) => item.has_defi).length;

  const loraDevices = fleet.filter((item) => item.has_lora).length;

  const workingDefibrillators = fleet.filter((item) => 
    item.has_defi && item.is_working_defi).length;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900"
    >

      {/* Navigation */}

      <nav
        className=" sticky top-0 bg-slate-950 text-white
          border-b border-slate-800 z-1000">

        <div
          className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="font-bold text-xl">
            Defergency
          </div>


          <div
            className="hidden md:flex items-center gap-7 text-sm">

            <a href="#about" className="hover:text-red-400">
              איך זה עובד?
            </a>

            <a href="#lora" className="hover:text-red-400">
              מה זה LoRa?
            </a>

            <a href="#network" className="hover:text-red-400">
              הרשת
            </a>

            <a href="#fleet" className="hover:text-red-400">
              המתנדבים
            </a>

            <a href="#purchase" className="hover:text-red-400">
             רכישת LoRa
            </a>
 
          </div>
          <div className="flex items-center gap-3">

            <Link href="/login" className="border border-slate-600
            hover:bg-white/10 px-4 py-2 rounded-lg font-bold text-sm">
              כניסה
            </Link>

            <a href="#register" className=" bg-red-600 hover:bg-red-700 px-4 py-2
              rounded-lg font-bold text-sm">
            הצטרפו לרשת
          </a>
          </div>
          


        </div>
      </nav>


      {/* hero */}

      <section
        className=" bg-slate-950 text-white py-24">

        <div className="max-w-7xl mx-auto px-6">

          <div className="max-w-3xl">

            <p className=" text-red-400 font-semibold mb-4">
             רשת קהילתית להצלת חיים 
            </p>

            <h1
              className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              {homeContent.hero.title}
            </h1>

            <p className="text-lg md:text-xl text-slate-300
                leading-8 max-w-2xl mb-9">
              {homeContent.hero.subtitles}
            </p>

            <div className="flex flex-wrap gap-4">

              <a href="#register" className="bg-red-600 hover:bg-red-700
                      px-6 py-3 rounded-lg font-bold">
                הצטרפו למיזם
              </a>

              <a href="#network" className="border border-slate-600 hover:bg-white/10
                  px-6 py-3 rounded-lg font-bold">
                צפו ברשת
              </a>

            </div>

          </div>

        </div>

      </section>


      {/* How it works */}

      <section id="about" className="py-20">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">

            <h2 className="text-3xl font-bold mb-3">
              איך זה עובד?
            </h2>

            <p className="text-slate-600">
              מהרגע שמתקבלת קריאת מצוקה ועד
              שמתנדב יוצא לדרך.
            </p>

          </div>

          <div
            className="grid md:grid-cols-4 gap-6">

            <div
              className=" bg-white rounded-2xl p-7 shadow-sm border
               border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <Siren size={50} color="#dc2626" />
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                קריאת מצוקה
              </h3>

              <p className="text-slate-600 text-center">
                מיקום אירוע החירום מתקבל
                במערכת.
              </p>

            </div>


            <div
              className=" bg-white rounded-2xl p-7 shadow-sm border
                border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <MapPin color="#dc2626" size={50} />
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                איתור ציוד קרוב
              </h3>

              <p className="text-slate-600 text-center">
                המערכת מאתרת באמצעות
                Geo-fencing את המכשירים
                הקרובים והתקינים.
              </p>

            </div>


            <div
              className=" bg-white rounded-2xl p-7
                shadow-sm border border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <SatelliteDish size={50} color="#dc2626" />
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                שליחת התראה
              </h3>

              <p className="text-slate-600 text-center">
                ההתראה מופצת דרך הסלולר
                ובמקביל באמצעות LoRa.
              </p>

            </div>

            <div
              className=" bg-white rounded-2xl p-7
                shadow-sm border border-slate-200">

              <div className="flex justify-center text-4xl mb-4">
                <Bike size={50} color="#dc2626"/>
              </div>

              <h3 className="font-bold text-lg mb-2 text-center">
                המתנדב יוצא לדרך
              </h3>

              <p className="text-slate-600 text-center">
                המתנדב מקבל ניווט מהיר
                לעבר האירוע.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* LoRa */}

      <section
        id="lora"
        className=" bg-slate-900 text-white py-20">

        <div className="max-w-7xl mx-auto
            px-6 grid md:grid-cols-2 gap-14 items-center">

        <div>

            <p className=" text-red-400 font-semibold mb-3">
              תקשורת גם מעבר לרשת הסלולרית
            </p>

            <h2 className=" text-3xl md:text-4xl font-bold
                mb-6 text-white ">
             {homeContent.lora.title}
            </h2>

            <p className=" text-slate-300 leading-8 text-lg">
               {homeContent.lora.description}
            </p>

          </div>


          <div
            className=" bg-slate-800 rounded-2xl p-8
              border border-slate-700">

            <div
              className="flex items-center justify-between gap-4">

              <div className="text-center">
                <div className="text-4xl">
                  <Siren size={35}/>
                </div>
                <p className="mt-2 text-sm">
                  אירוע
                </p>
              </div>

              <div className="text-slate-500 text-2xl">
                <MoveLeft />
              </div>

              <div className="text-center">
                <div className="text-4xl">
                  <SatelliteDish size={35} />
                </div>
                <p className="mt-2 text-sm">
                  LoRa
                </p>
              </div>

              <div className="text-slate-500 text-2xl">
                <MoveLeft />
              </div>

              <div className="text-center">
                <div className="text-4xl">
                  <Smartphone size={35}/>
                </div>
                <p className="mt-2 text-sm">
                  מתנדב
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Network */}

      <section id="network" className="py-20">

        <div className=" max-w-7xl mx-auto px-6">

          <div className="mb-8">

            <h2 className=" text-3xl font-bold mb-2">
              הרשת בזמן אמת
            </h2>

            <p className="text-slate-600">
              סימולציה של מיקום
              דפיברילטורים ואירועי
              חירום פעילים.
            </p>

          </div>


          {/* Statistics  */}

          <div className="grid md:grid-cols-4 gap-4 mb-8">

            <DashboardCard value={fleet.length}
              label="משתמשים ברשת"/>

            <DashboardCard value={defibrillators}
              label="דפיברילטורים ניידים"/>


            <DashboardCard value={loraDevices}
              label="מכשירי LoRa"/>

            <DashboardCard value={stationaryDefibrillators.length}
              label="דפיברילטורים נייחים"/>

          </div>


          {/* MAP */}

          <div
            className=" flex justify-center bg-white rounded-2xl shadow-sm border border-slate-200
              overflow-hidden p-4">

            {loading ? (

              <div className="h-125 flex items-center justify-center
                  text-slate-500">
                טוען את מפת הרשת...
              </div>

            ) : (

              <FleetMap key="fleet-map" fleet={fleet}
              stationaryDefibrillators={stationaryDefibrillators}
                emergencies={emergencies}
                selectedEmergencyId={
                  selectedEmergencyId
                }
                candidates={candidates}
                onEmergencySelect={
                  handleEmergencySelect
                }
                onClearEmergencySelection={
                  handleClearEmergencySelection
                }/>

            )}

          </div>

           <p className="text-center">
                 המידע אודות הדפיברילטורים הנייחים תודות ל
                 <a href="https://defi.co.il/#/map"
                 className="font-bold">
                 "איפה דפי"
                 </a>
          </p>

        </div>

      </section>


      {/* Fleet Table */}

      <section
        id="fleet"
        className=" bg-white py-20">

        <div
          className=" max-w-7xl mx-auto px-6">

          <div className="mb-8">

            <h2 className="text-3xl font-bold">
              סטטוס הרשת
            </h2>

            <p className="text-slate-600 mt-2">
              מצב המכשירים הרשומים
              בסימולטור.
            </p>

          </div>


          <div
            className="
              max-h-105 overflow-x-auto overflow-y-auto 
              rounded-2xl border border-slate-200">

              <table className="w-full text-sm">

              <thead className="w-full text-sm bg-slate-100">

                <tr>

                  <th className="p-4 text-right">
                    בעלים
                  </th>

                  <th className="p-4 text-right">
                    דפיברילטור
                  </th>

                  <th className="p-4 text-right">
                    LoRa
                  </th>

                  <th className="p-4 text-right">
                    DevEUI
                  </th>

                  <th className="p-4 text-right">
                    סוללה
                  </th>

                  <th className="p-4 text-right">
                    סטטוס
                  </th>

                </tr>

              </thead>


              <tbody>

                {fleet.map((item) => (

                  <tr
                    key={item.id_fleet}
                    className=" border-t border-slate-200 hover:bg-slate-50">

                    <td className="p-4 font-medium">
                      {item.first_name}{' '}
                      {item.last_name}
                    </td>

                    <td className="p-4">
                      {item.has_defi
                        ? 'כן'
                        : 'לא'}
                    </td>

                    <td className="p-4">
                      {item.has_lora
                        ? 'כן'
                        : 'לא'}
                    </td>

                    <td
                      dir="ltr"
                      className="p-4 text-right"
                    >
                      {item.dev_EUI ?? '-'}
                    </td>

                    <td className="p-4">

                      {item.lora_battery !== null
                        ? `${item.lora_battery}%`
                        : '-'}

                    </td>

                    <td className="p-4">

                      {item.is_working_defi ? (

                        <span
                          className=" text-green-700 font-medium">
                          תקין
                        </span>

                      ) : (

                        <span
                          className=" text-red-700 font-medium">
                          לא זמין
                        </span>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </section>

       {/* Purchase LoRa */}

      <section id="purchase" className="bg-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-6">

              <div className="text-center mb-12">

              <p className="text-red-600 font-semibold mb-3">
                 עזרו לנו להרחיב את הרשת
                </p>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
               רכישת מכשיר LoRa
            </h2>

            <p className="max-w-3xl mx-auto text-slate-600 leading-7">
               ניתן להצטרף לרשת גם באמצעות מכשיר LoRa בלבד.
               בעת הרכישה יש לוודא בחירת דגם התומך בתדר
              <strong> 433 MHz </strong>
             בהתאם לדרישות המיזם.
            </p>

          </div>


      <div className="grid md:grid-cols-3 gap-6">

        {/* LILYGO */}

        <div
        className=" bg-white border border-slate-200 rounded-2xl
          p-7 shadow-sm  flex flex-col">

        <div className="text-4xl mb-4">
          <img src={"https://lilygo.cc/cdn/shop/files/LILYGO-T-LORA-PAGER_3_2e55c5fa-aa11-49eb-b5bd-cbc4268eea92.jpg?v=1760066823&width=493"}/>
        </div>

        <h3 className="text-xl font-bold mb-2">
          LILYGO
        </h3>

        <p className="text-slate-600 mb-4 leading-6">
          מכשירי LoRa תואמי Meshtastic.
          קיימים דגמים עם אפשרות לתדר 433 MHz.
        </p>

        <div
          className=" inline-block self-start bg-amber-100  text-amber-800
            text-sm font-bold px-3 py-1 rounded-full mb-6">
          יש לבחור 433 MHz
        </div>

        <a
          href="https://lilygo.cc/products/t-lora-pager-meshtastic"
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-auto
            bg-slate-900
            hover:bg-slate-800
            text-white
            text-center
            rounded-lg
            py-3
            font-bold
          "
        >
          מעבר לאתר הרכישה
        </a>

      </div>


      {/* RAKWIRELESS */}

      <div
        className=" bg-white border border-slate-200 rounded-2xl p-7
                   shadow-sm flex flex-col">

        <div className="text-4xl mb-4">
          <img src={"https://store.rakwireless.com/cdn/shop/products/rak4631-l-isometric_4000x.progressive.png?v=1669697021"}/>
        </div>

        <h3 className="text-xl font-bold mb-2">
          RAKwireless
        </h3>

        <p className="text-slate-600 mb-4 leading-6">
          רכיבי LoRa חסכוניים באנרגיה המתאימים
          לפרויקטים ניידים ורשתות Mesh.
          קיימת גרסת 433–470 MHz.
        </p>

        <div
          className=" inline-block self-start bg-amber-100
            text-amber-800 text-sm font-bold px-3 py-1
            rounded-full mb-6">
          433–470 MHz
        </div>

        <a
          href="https://store.rakwireless.com/products/rak4631-lpwan-node"
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-auto
            bg-slate-900
            hover:bg-slate-800
            text-white
            text-center
            rounded-lg
            py-3
            font-bold
          "
        >
          מעבר לאתר הרכישה
        </a>

      </div>


      {/* third option */}

      <div
        className=" bg-white border border-slate-200
          rounded-2xl p-7 shadow-sm flex flex-col">

        <div className="text-4xl mb-4">
          <img src={"https://store.rakwireless.com/cdn/shop/files/20230710100915_c9f54683-9513-4872-abf2-34d0f6f92e63_4000x.progressive.jpg?v=1732774731"}/>
        </div>

        <h3 className="text-xl font-bold mb-2">
          RAK3172
        </h3>

        <p className="text-slate-600 mb-4 leading-6">
          מודול LoRa נוסף המתאים לפיתוח ושילוב
          במכשירים מותאמים אישית, כולל גרסת
          EU433.
        </p>

        <div
          className="inline-block self-start bg-amber-100
            text-amber-800 text-sm font-bold px-3 py-1
            rounded-full mb-6">
          EU433
        </div>

        <a
          href="https://store.rakwireless.com/products/wisduo-lpwan-module-rak3172"
          target="_blank"
          rel="noopener noreferrer"
          className="
            mt-auto bg-slate-900 hover:bg-slate-800
            text-white text-center rounded-lg
             py-3 font-bold">
          מעבר לאתר הרכישה
        </a>

      </div>

    </div>


    <p
      className=" text-center text-sm text-slate-500 mt-8">
      הקישורים מוצגים לצורכי מידע והדגמת המיזם בלבד.
      יש לבדוק תאימות תדר ורגולציה לפני רכישה ושימוש בפועל.
    </p>

      </div>
    </section>           


      {/* join the project */}

      <section
        id="register"
        className=" bg-red-700 text-white py-20">

        <div className=" max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-3xl md:text-4xl font-bold mb-5">
           {homeContent.registration.title}
          </h2>

          <p
            className=" text-red-100 text-lg leading-8 mb-8">
           {homeContent.registration.description}
          </p>

        </div>


        <form onSubmit={handleRegistration}
        className="bg-white text-slate-900 rounded-xl p-8
                  shadow-lg space-y-5">

        <div className="grid md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block font-medium mb-1">
                    שם פרטי
                  </label>
                
                <input required type="text"
                value={form.firstName} onChange={(e) => setForm({...form, firstName:e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"/>

                </div>

                <div>
                  <label className="block font-medium mb-1">
                    שם משפחה
                  </label>

                  <input type="text" value={form.lastName}
                  onChange={(e) => setForm({...form, lastName:e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                </div>
          </div>

                <div>
                  <label className="block font-medium mb-1">
                    מספר טלפון
                  </label>
                  <input required type="tel" value={form.phone} 
                    onChange={(e) => {setForm({...form, phone: e.target.value})}}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"/>
                </div>
                
                <div>
                  <label className="block font-medium mb-1">
                    איך תרצו להצטרף?
                  </label>

                  <select value={form.participantType}
                  onChange={(e) => setForm({...form, participantType: 
                    e.target.value as ReigsterationForm['participantType']
                  })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">

                    <option value="DEFIBRILLATOR">
                      יש לי דפיברילטור נייד
                    </option>

                    <option value="LORA">
                      יש לי מכשיר LoRa
                    </option>

                    <option value="DEFIBRILLATOR_WITH_LORA">
                      יש לי דפיברליטור נייד וגם מכשיר LoRa
                    </option>
                  </select>
                </div>

                {hasLora && (
                  <div>
                    <label className="block font-medium mb-1">
                      מזהה LoRa / devEUI 
                    </label>

                  <input required type="text" value={form.devEUI}
                  onChange={(e) => setForm({...form, devEUI: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3
                  py-2 font-mono"/>
                  </div>
                )}

                <div>
                
                <label className="block font-medium">
                  הכשרה רפואית
                </label>

                <select value={form.medicalTraining} 
                        onChange={(e) => setForm({...form, medicalTraining: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">

                  <option value="First Aid">
                    עזרה ראשונה
                  </option>

                  <option value="Medic">
                  חובש/ת
                  </option>

                  <option value="Paramedic">
                    פרמדיק/ית
                  </option>

                  <option value="Doctor">
                    רופא/ה
                  </option>

                </select>

                </div>

                <button
                className=" bg-red-600 text-white px-7 py-3 rounded-lg
                       font-bold hover:bg-red-700">
                       הרשמה למיזם
                </button>

                {registrationMessage && (
                  <p className="text-center font-medium">
                    {registrationMessage}
                  </p>
                )}   

        </form>

      </section>


      {/* Footer */}

      <footer
        className=" bg-slate-950 text-slate-400 py-8">

        <div
          className=" max-w-7xl mx-auto px-6 flex
            justify-between flex-wrap gap-4">

          <span>
            Defergency
          </span>

          <span>
            פרויקט גמר בקורס
            פיתוח WEB
          </span>

        </div>

      </footer>

    </main>
  );
}


/*
 * Dashboard statistic card.
 */
function DashboardCard({
  value,
  label
}: {
  value: number;
  label: string;
}) {

  return (

    <div
      className=" bg-white border border-slate-200 rounded-xl p-5">

      <div
        className="text-3xl font-bold">
        {value}
      </div>

      <div className=" text-slate-500 mt-1">
        {label}
      </div>

    </div>

  );
}