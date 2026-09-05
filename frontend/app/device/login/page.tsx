'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Siren, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DeviceLoginPage() {
    const router = useRouter();

    const [showSplash, setShowSplash] = useState(true);

    const [firstName, setFirstName] = useState('');

    const [phone, setPhone] = useState('');

    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setLoading(true);
            setError('');

            const response = await fetch(
                'http://localhost:3001/api/participant-login',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        first_name: firstName,
                        phone
                    })
                }
            );

            const data = await response.json();

            const fleetId = data.participant?.id_fleet;

            if(!fleetId) {
                throw new Error('Backend did not return a fleetId');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('participantAccessToken', data.accessToken);

            router.push(`/device/${fleetId}`);

        } catch (error) {
            console.error('Participant login failed:', error);

            setError('פרטי ההתחברות אינם נכונים');

        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            className="min-h-screen bg-slate-100 flex
                items-center justify-center p-4">

            <div className="relative w-full
            max-w-107.5 min-h-212.5 bg-white
            rounded-[2.5rem] border-8
             border-slate-900 shadow-2xl
            overflow-hidden">

            {/* Splash screen */}
            {showSplash && (
                <div className=" absolute inset-0
                 z-50 flex flex-col items-center
                 justify-center text-white
                 bg-gradient-to-br from-red-950
                 via-red-700 to-red-500
                splash-fade">
             <div className="siren-pulse">
                 <Siren size={90} strokeWidth={1.8}/>
            </div>
                 <h1 className="text-3xl font-bold mt-6">
                    Defergency
                </h1>

                <p className="mt-2 text-red-100">
                            רשת קהילתית להצלת חיים
                        </p>
                    </div>
                )}

                {/* Phone screen */}

                <div className="min-h-208.5 flex flex-col bg-slate-50">
                    {/* Top phone area */}

                    <div  className=" bg-slate-950 h-12
                            flex justify-center items-start pt-2">
                        <div className=" w-24 h-5 bg-black
                            rounded-full"
                        />
                    </div>

                    {/* Login content */}

                    <div className=" flex-1 flex items-center justify-center px-7">
                        <div className="w-full">

                        <div className=" text-center *:mb-10">
                            <div className="mx-auto w-16 h-16
                             rounded-2xl bg-red-600 text-white
                             flex items-center justify-center
                             shadow-md mb-5">

                                    <Siren size={34} />
                                </div>

                                <h1 className=" text-3xl font-bold text-slate-900">
                                    ברוכים הבאים
                                </h1>

                                <p className=" text-slate-500 mt-2">
                                   התחברות מתנדב
                                </p>
                            </div>

                            <form onSubmit={handleLogin}
                                className="space-y-5"
                                dir="rtl">
                                <div>
                                    <label className=" block mb-2 font-medium">
                                        שם פרטי
                                    </label>

                                    <input type="text" required
                                        value={firstName} onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                        className="w-full border border-slate-300
                                            rounded-xl px-4 py-3 bg-white
                                            focus:outline-none focus:ring-2
                                            focus:ring-red-500"
                                    />
                                </div>

                                <div>
                                    <label className=" block mb-2 font-medium ">
                                        מספר טלפון
                                    </label>

                                    <input type="tel" required value={phone}
                                        onChange={(e) =>setPhone( e.target.value)}
                                        className="w-full border border-slate-300 rounded-xl
                                            px-4 py-3 bg-white focus:outline-none
                                            focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                {error && (
                                    <p className=" text-red-600 text-sm text-center">
                                        {error}
                                    </p>
                                )}


                                <button type="submit" disabled={loading}
                                    className=" w-full bg-red-600 hover:bg-red-700
                                        text-white font-bold py-3.5
                                        rounded-xl transition disabled:opacity-50">
                                    {
                                        loading
                                            ? 'מתחבר...'
                                            : 'כניסה'
                                    }
                                </button>
                            </form>

                            <p dir="rtl" className="text-center text-sm text-slate-500 mt-5">
                                עדיין לא רשומים?
                            </p>

                            <button type="button" onClick={() =>
                            router.push('/device/register')}
                            className=" w-full mt-2 border border-red-600
                             text-red-600 font-bold py-3 rounded-xl
                             hover:bg-red-50 transition">
                             הרשמה לרשת
                        </button>

                         <Link href="/device" 
                                className="w-10
                                h-10 rounded-full bg-white/10
                             hover:bg-white/20 text-white
                                flex items-center justify-center transition" 
                                aria-label="חזרה">
                                <ArrowLeft size={30} color="#dc2626"/>
                                </Link>

                        </div>
                    </div>


                    {/* Bottom phone indicator */}

                    <div className="py-4">
                        <div
                            className=" w-32 h-1.5 bg-slate-300 rounded-full mx-auto"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}