'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Siren } from 'lucide-react';

type ParticipantType =
    | 'DEFIBRILLATOR'
    | 'LORA'
    | 'DEFIBRILLATOR_WITH_LORA';

export default function DeviceRegisterPage() {
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [medicalTraining, setMedicalTraining] = useState('First Aid');
    const [participantType, setParticipantType] = useState<ParticipantType>('DEFIBRILLATOR');
    const [devEUI, setDevEUI] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const hasDefi =
        participantType === 'DEFIBRILLATOR' ||
        participantType === 'DEFIBRILLATOR_WITH_LORA';

    const hasLora =
        participantType === 'LORA' ||
        participantType === 'DEFIBRILLATOR_WITH_LORA';

    async function handleRegister(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setLoading(true);
            setMessage('');
            setSuccess(false);

            const response = await fetch(
                'http://localhost:3001/api/register',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName || null,
                        phone,

                        has_defi: hasDefi,
                        has_lora: hasLora,

                        dev_EUI:
                            hasLora
                                ? devEUI
                                : null,

                        med_training:
                            medicalTraining || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error( data.error || 'Registration failed');
            }

            setSuccess(true);
            setMessage('ההרשמה הושלמה בהצלחה!');

            setTimeout(() => {
                router.push('/device/login');
            }, 1500);

        } catch (error) {console.error( 'Registration failed:', error);

            setMessage(error instanceof Error
                        ? error.message
                        : 'אירעה שגיאה בהרשמה');

        } finally {
            setLoading(false);
        }
    }

    return (
        <main
            className=" min-h-screen bg-slate-100
                flex items-center justify-center p-4">
            <div
                className="relative w-full max-w-107.5
                    min-h-212.5 bg-white rounded-[2.5rem]
                    border-8 border-slate-900
                    shadow-2xl overflow-hidden">

                {/* Phone top */}
                <div
                    className=" bg-slate-950 text-white
                        px-5 pt-3 pb-4">
                    <div
                        className="w-24 h-5 bg-black
                        rounded-full mx-auto mb-4"/>

                    <div className=" flex items-center justify-between">
                        <button type="button"
                         onClick={() => router.push('/device/login')}
                            className=" text-slate-300 hover:text-white">
                            <ArrowRight size={22} />
                        </button>

                        <div className="text-right">
                            <p className="text-xs text-slate-400">
                                Defergency
                            </p>

                            <h1 className="font-bold text-lg">
                                הרשמה לרשת
                            </h1>
                        </div>
                    </div>
                </div>


                {/* Registration form */}

                <div
                    className=" bg-slate-50 p-5 overflow-y-auto
                        max-h-190"dir="rtl">
                    <div className="flex justify-center mb-5">
                        <div className="w-14 h-14
                         bg-red-600 text-white rounded-2xl
                        flex items-center justify-center">
                            <Siren size={30} />
                        </div>
                    </div>

                    <form
                        onSubmit={handleRegister}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block mb-2 font-medium">
                                שם פרטי
                            </label>

                            <input
                                type="text" required value={firstName}
                                onChange={(e) =>setFirstName(e.target.value)}
                                className="w-full border border-slate-300
                                    rounded-xl px-4 py-3 bg-white
                                    focus:outline-none focus:ring-2 focus:ring-red-500"/>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium">
                                שם משפחה
                            </label>

                            <input type="text" value={lastName}
                                onChange={(e) =>setLastName(e.target.value)}
                                className="w-full border border-slate-300
                                    rounded-xl px-4 py-3  bg-white
                                    focus:outline-none focus:ring-2 focus:ring-red-500"/>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium">
                                מספר טלפון
                            </label>

                            <input type="tel" required value={phone}
                             onChange={(e) =>setPhone(e.target.value)}
                                className="w-full border border-slate-300
                                    rounded-xl px-4 py-3 bg-white
                                    focus:outline-none focus:ring-2
                                    focus:ring-red-500"/>
                        </div>

                        <div>
                            <label className="block mb-2 font-medium">
                                סוג הצטרפות
                            </label>

                            <select
                                value={participantType}
                                onChange={(e) =>setParticipantType(
                                        e.target.value as ParticipantType)}
                                className="w-full border border-slate-300
                                    rounded-xl px-4 py-3
                                    bg-white">

                                <option value="DEFIBRILLATOR">
                                    בעל/ת דפיברילטור
                                </option>

                                <option value="LORA">
                                    משתתף/ת LoRa
                                </option>

                                <option value="DEFIBRILLATOR_WITH_LORA">
                                    דפיברילטור + LoRa
                                </option>
                            </select>
                        </div>


                       <div>
                        <label className="block mb-2 font-medium">
                         הכשרה רפואית
                        </label>
                                        
                            <select value={medicalTraining}
                            onChange={(e) => {
                                console.log('Selected  medical training:', e.target.value);
                                setMedicalTraining(e.target.value);

                            }}
                            className="w-full border border-slate-300 rounded-xl
                             px-4 py-3 bg-white">

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
                                       



                        {hasLora && (
                            <div>
                                <label className="block mb-2 font-medium">
                                    DevEUI
                                </label>

                                <input type="text" required value={devEUI}
                                    onChange={(e) =>setDevEUI( e.target.value)}
                                    className=" w-full  border border-slate-300
                                        rounded-xl px-4 py-3
                                        bg-white"
                                />
                            </div>
                        )}

                        {message && (
                            <p
                                className={
                                    success
                                        ? 'text-green-600 text-center text-sm'
                                        : 'text-red-600 text-center text-sm'
                                }
                            >
                                {message}
                            </p>
                        )}


                        <button
                            type="submit" disabled={loading}
                            className="w-full bg-red-600
                                hover:bg-red-700 text-white
                                font-bold py-3.5 **:rounded-xl
                                transition disabled:opacity-50">
                            {
                                loading
                                    ? 'נרשם...'
                                    : 'הרשמה'
                            }
                        </button>

                        <button type="button"
                            onClick={() =>
                                router.push('/device/login')
                            }
                            className=" w-full text-slate-500 text-sm py-2">
                            כבר רשומים? חזרה להתחברות
                        </button>
                    </form>
                </div>


                {/* Phone bottom */}

                <div className="bg-white py-3">
                    <div
                        className="w-32 h-1.5 bg-slate-300 rounded-full
                            mx-auto"/>
                </div>
            </div>
        </main>
    );
}