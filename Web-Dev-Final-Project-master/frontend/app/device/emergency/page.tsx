'use client';

import {
    useState
} from 'react';

import Link from 'next/link';

import dynamic from 'next/dynamic';

import {  ArrowRight, LocateFixed, MapPin, Siren, CircleCheckBig, LoaderCircle} from 'lucide-react';


const EmergencyLocationMap =
    dynamic(() => import('@/app/device/emergency/EmergencyLocationMap'),{
            ssr: false
        }
    );


type Location = {
    latitude: number;
    longitude: number;
};


export default function EmergencyPage() {

    const [location, setLocation] = useState<Location | null>(null);

    const [locating, setLocating] = useState(false);

    const [sending, setSending] = useState(false);

    const [error, setError] = useState('');

    const [emergencyId, setEmergencyId] = useState<number | null>(null);


    // GET CURRENT GPS LOCATION

    function getCurrentLocation() {

        setError('');
        setLocating(true);

        if (!navigator.geolocation) {

            setError(
                'המכשיר אינו תומך בשירותי מיקום. ניתן לבחור מיקום ידנית במפה.'
            );

            setLocating(false);
            return;
        }


        navigator.geolocation.getCurrentPosition(

            (position) => {

                setLocation({
                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude
                });


                setLocating(false);
            },


            (error) => {

                console.error(
                    'GPS failed:',
                    error
                );


                setError(
                    'לא הצלחנו לקבל את המיקום הנוכחי. ניתן לבחור את המיקום ידנית במפה.'
                );


                setLocating(false);
            },


            {
                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 0
            }
        );
    }

    // SEND EMERGENCY

    async function sendEmergency() {

        if (!location) {

            setError(
                'יש לבחור מיקום לפני שליחת הקריאה'
            );

            return;
        }
        setSending(true);
        setError('');


        try {

            const response =
                await fetch(
                    'http://localhost:3001/api/emergencies',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                latitude:
                                    location.latitude,

                                longitude:
                                    location.longitude
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    'Failed to create emergency'
                );
            }

            const createdEmergencyId =
                data.id_emergency ??
                data.emergency?.id_emergency ??
                null;


            setEmergencyId(
                createdEmergencyId
            );


        } catch (error) {

            console.error(
                'Emergency creation failed:',
                error
            );


            if (
                error instanceof Error
            ) {

                setError(
                    `שליחת הקריאה נכשלה: ${error.message}`
                );

            } else {

                setError(
                    'שליחת הקריאה נכשלה'
                );
            }


        } finally {

            setSending(false);
        }
    }

    // SUCCESS SCREEN

    if (emergencyId !== null) {

        return (

            <main
                dir="rtl"
                className="
                    min-h-screen
                    bg-slate-100
                    flex
                    items-center
                    justify-center
                    px-4
                    py-8
                "
            >

                <PhoneShell>

                    <div
                        className="
                            flex-1
                            flex
                            flex-col
                            items-center
                            justify-center
                            text-center
                            px-7
                        "
                    >

                        <div
                            className="
                                w-24
                                h-24
                                rounded-full
                                bg-green-100
                                text-green-700
                                flex
                                items-center
                                justify-center
                                mb-6
                            "
                        >

                            <CircleCheckBig
                                size={52}
                            />

                        </div>


                        <h1
                            className="
                                text-3xl
                                font-bold
                                mb-4
                            "
                        >
                            הקריאה נשלחה
                        </h1>


                        <p
                            className="
                                text-slate-600
                                leading-7
                                mb-3
                            "
                        >
                            מיקום האירוע נשלח
                            למערכת בהצלחה.
                        </p>


                        <p
                            className="
                                text-slate-600
                                leading-7
                                mb-8
                            "
                        >
                            המערכת מאתרת כעת
                            מתנדבים ודפיברילטורים
                            זמינים בקרבת מקום.
                        </p>


                        <div
                            className="
                                bg-slate-100
                                rounded-xl
                                px-5
                                py-3
                                text-sm
                                text-slate-600
                                mb-8
                            "
                        >
                            מספר אירוע:
                            {' '}
                            <strong>
                                #{emergencyId}
                            </strong>
                        </div>


                        <Link
                            href="/device"
                            className="
                                border
                                border-slate-300
                                rounded-lg
                                px-6
                                py-3
                                font-medium
                                hover:bg-slate-50
                            "
                        >
                            חזרה למסך הראשי
                        </Link>

                    </div>

                </PhoneShell>

            </main>
        );
    }

    // EMERGENCY FORM

    return (

        <main
            dir="rtl"
            className="
                min-h-screen
                bg-slate-100
                flex
                items-center
                justify-center
                px-4
                py-8
            "
        >

            <PhoneShell>

                {/* HEADER */}

                <header
                    className="
                        bg-red-700
                        text-white
                        pt-12
                        pb-6
                        px-6
                        relative
                    "
                >

                    <Link
                        href="/device"
                        className="
                            absolute
                            top-10
                            right-5
                            w-10
                            h-10
                            rounded-full
                            bg-white/15
                            hover:bg-white/25
                            flex
                            items-center
                            justify-center
                        "
                        aria-label="חזרה"
                    >

                        <ArrowRight
                            size={22}
                        />

                    </Link>


                    <div
                        className="
                            text-center
                            pt-5
                        "
                    >

                        <Siren
                            size={46}
                            className="
                                mx-auto
                                mb-3
                            "
                        />


                        <h1
                            className="
                                text-2xl
                                font-bold
                            "
                        >
                            קריאה לעזרה
                        </h1>


                        <p
                            className="
                                text-red-100
                                mt-2
                                text-sm
                            "
                        >
                            בחרו את מיקום האירוע
                        </p>

                    </div>

                </header>


                {/* CONTENT */}

                <section
                    className="
                        flex-1
                        overflow-y-auto
                        px-5
                        py-6
                    "
                >

                    <button
                        type="button"

                        onClick={
                            getCurrentLocation
                        }

                        disabled={
                            locating
                        }

                        className="
                            w-full
                            flex
                            items-center
                            justify-center
                            gap-3
                            bg-slate-950
                            hover:bg-slate-800
                            disabled:bg-slate-400
                            text-white
                            rounded-xl
                            px-5
                            py-4
                            font-bold
                            mb-5
                        "
                    >

                        {
                            locating
                                ? (
                                    <LoaderCircle
                                        size={22}
                                        className=
                                            "animate-spin"
                                    />
                                )
                                : (
                                    <LocateFixed
                                        size={22}
                                    />
                                )
                        }


                        {
                            locating
                                ? 'מאתר מיקום...'
                                : 'שימוש במיקום הנוכחי'
                        }

                    </button>


                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            mb-4
                        "
                    >

                        <div
                            className="
                                h-px
                                bg-slate-200
                                flex-1
                            "
                        />

                        <span
                            className="
                                text-sm
                                text-slate-400
                            "
                        >
                            או בחירה ידנית
                        </span>

                        <div
                            className="
                                h-px
                                bg-slate-200
                                flex-1
                            "
                        />

                    </div>


                    {/* MAP */}

                    <div
                        className="
                            rounded-2xl
                            overflow-hidden
                            border
                            border-slate-200
                            mb-5
                        "
                    >

                        <EmergencyLocationMap location={location}
                            onLocationChange={setLocation}
                        />

                    </div>


                    {location && (

                        <div
                            className="
                                bg-green-50
                                border
                                border-green-200
                                rounded-xl
                                p-4
                                mb-5
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-start
                                    gap-3
                                "
                            >

                                <MapPin
                                    className="
                                        text-green-700
                                        shrink-0
                                    "
                                    size={22}
                                />


                                <div>

                                    <p
                                        className="
                                            font-bold
                                            text-green-800
                                            mb-1
                                        "
                                    >
                                        מיקום נבחר
                                    </p>


                                    <p
                                        dir="ltr"
                                        className="
                                            text-xs
                                            text-green-700
                                            font-mono
                                        "
                                    >
                                        {
                                            location.latitude
                                                .toFixed(6)
                                        }
                                        ,
                                        {' '}
                                        {
                                            location.longitude
                                                .toFixed(6)
                                        }
                                    </p>

                                </div>

                            </div>

                        </div>
                    )}


                    {error && (

                        <p
                            className="
                                bg-red-50
                                border
                                border-red-200
                                text-red-700
                                rounded-lg
                                p-3
                                text-sm
                                mb-5
                            "
                        >
                            {error}
                        </p>
                    )}


                    <button
                        type="button"

                        onClick={sendEmergency}

                        disabled={
                            !location ||
                            sending
                        }

                        className="
                            w-full
                            bg-red-600
                            hover:bg-red-700
                            disabled:bg-slate-300
                            disabled:text-slate-500
                            text-white
                            rounded-xl
                            px-5
                            py-4
                            font-bold
                            text-lg
                            flex
                            items-center
                            justify-center
                            gap-3
                        "
                    >

                        {
                            sending
                                ? (
                                    <LoaderCircle
                                        className=
                                            "animate-spin"
                                        size={23}
                                    />
                                )
                                : (
                                    <Siren
                                        size={23}
                                    />
                                )
                        }


                        {
                            sending
                                ? 'שולח קריאה...'
                                : 'אישור ושליחת קריאה'
                        }

                    </button>


                    <p
                        className="
                            text-xs
                            text-slate-400
                            text-center
                            leading-5
                            mt-4
                        "
                    >
                        אין צורך בחשבון משתמש
                        לצורך שליחת קריאת חירום.
                    </p>

                </section>

            </PhoneShell>

        </main>
    );
}


// ============================
// PHONE SHELL
// ============================

function PhoneShell({
    children
}: {
    children:
        React.ReactNode;
}) {

    return (

        <div
            className="
                w-full
                max-w-[430px]
                h-[780px]
                bg-white
                border-[10px]
                border-slate-900
                rounded-[42px]
                shadow-2xl
                overflow-hidden
                relative
                flex
                flex-col
            "
        >

            {/* NOTCH */}

            <div
                className="
                    absolute
                    top-0
                    left-1/2
                    -translate-x-1/2
                    w-36
                    h-7
                    bg-slate-900
                    rounded-b-2xl
                    z-20
                "
            />


            {children}


            {/* HOME INDICATOR */}

            <div
                className="
                    bg-white
                    pb-3
                    pt-2
                    flex
                    justify-center
                "
            >

                <div
                    className="
                        w-28
                        h-1.5
                        bg-slate-900
                        rounded-full
                    "
                />

            </div>

        </div>
    );
}