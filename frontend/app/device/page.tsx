'use client';

import Link from 'next/link';

import { Siren, LogIn, HeartPulse, ShieldCheck, Smartphone
} from 'lucide-react';


export default function DeviceLandingPage() {

    return (

        <main dir="rtl" className="
        min-h-screen bg-slate-100 flex
         items-center justify-center px-4 py-8">

            {/* PHONE SHELL */}

            <div
                className=" w-full max-w-107.5 min-h-190 bg-white border-10
                    border-slate-900 rounded-[42px] shadow-2xl overflow-hidden
                    relative flex flex-col">

                {/* TOP NOTCH */}

                <div className="absolute top-0 left-1/2 -translate-x-1/2
                        w-36 h-7 bg-slate-900 rounded-b-2xl z-10"/>

                {/* HEADER */}

                <header className=" bg-slate-950 text-white pt-12
                        pb-7 px-6">

                    <div className=" flex items-center justify-between gap-3">

                        <div>

                            <p className=" text-red-400 text-sm font-semibold mb-1">
                                Defergency
                            </p>

                            <h1 className=" text-2xl font-bold">
                                מערכת חירום קהילתית
                            </h1>

                        </div>

                        <div className=" w-12 h-12 rounded-full bg-red-600
                                flex items-center justify-center">

                            <HeartPulse size={27}/>

                        </div>

                    </div>

                </header>


                {/* CONTENT */}

                <section className=" flex-1 px-6 py-8">

                    <div className="text-center mb-8">

                        <Smartphone size={46} className="mx-auto text-slate-700 mb-4"/>


                        <h2 className="text-2xl font-bold mb-2">
                            איך נוכל לעזור?
                        </h2>

                        <p className=" text-slate-500 leading-7">
                            ניתן לדווח על אירוע חירום
                            גם ללא חשבון,
                            או להיכנס כמתנדב רשום.
                        </p>

                    </div>

                    {/* EMERGENCY CALL */}

                    <Link href="/device/emergency" className="block  bg-red-600 hover:bg-red-700
                            text-white rounded-2xl p-6 mb-5
                            shadow-md transition">

                        <div className="flex items-start gap-4">

                            <div className=" bg-white/15 rounded-xl p-3
                                    shrink-0">

                                <Siren size={34}/>

                            </div>

                            <div>

                                <h3 className=" text-xl font-bold mb-2">
                                    קריאה לעזרה
                                </h3>

                                <p className=" text-red-100 leading-6 text-sm">
                                    דיווח על מקרה חירום
                                    ושליחת המיקום למערכת.
                                    אין צורך בהתחברות.
                                </p>

                            </div>

                        </div>

                    </Link>


                    {/* VOLUNTEER LOGIN */}

                    <Link href="/device/login" className="block bg-slate-950 hover:bg-slate-900
                            text-white rounded-2xl p-6
                            shadow-md transition">

                        <div className="flex items-start gap-4">

                            <div className=" bg-white/10 rounded-xl
                                    p-3 shrink-0">

                                <LogIn size={32}/>

                            </div>

                            <div>
                                 <h3 className="text-xl font-bold mb-2">
                                    כניסת מתנדב
                                </h3>

                                <p className=" text-slate-300 leading-6 text-sm">
                                    כניסה לממשק המתנדב,
                                    צפייה בהתראות
                                    ויציאה לאירוע פעיל.
                                </p>

                            </div>

                        </div>

                    </Link>

                    {/* INFORMATION */}

                    <div className=" mt-8 bg-slate-50
                    border border-slate-200 rounded-xl
                     p-4 flex gap-3">

                        <ShieldCheck className=" text-green-600 shrink-0 mt-1"
                            size={22}/>

                        <p className="text-sm text-slate-600 leading-6">
                            במקרה חירום ניתן לשלוח
                            קריאה גם אם המשתמש
                            אינו רשום ברשת.
                        </p>

                    </div>

                </section>


                {/* BOTTOM HOME INDICATOR */}

                <div className="pb-3 pt-2 flex justify-center">

                    <div className="w-28 h-1.5 bg-slate-900
                            rounded-full"/>

                </div>
            </div>
        </main>
    );
}