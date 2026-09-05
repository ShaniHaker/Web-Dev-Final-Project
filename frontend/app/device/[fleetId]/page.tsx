'use client';

import { useParams} from 'next/navigation';

import { useEffect, useRef, useState } from 'react';

import { ChevronDown, Siren} from 'lucide-react';

import EmergencyCaller from '../EmergencyCaller';

import IncomingAlerts from '../IncomingAlerts';

import ActiveResponse from '../ActiveResponse';


type ActiveEmergency = {
    id_candidate: number;
    id_emergency: number;
    id_fleet: number;
    distance_km: number;
    responded_at: string | null;
    latitude: number;
    longitude: number;
    created_at: string;
    status: string;
};


export default function RegisteredDevicePage() {

    const params = useParams();

    const fleetId = Number(params.fleetId);


    const [
        activeEmergency,
        setActiveEmergency
    ] = useState<ActiveEmergency | null>(null);


    const [
        showEmergencySheet,
        setShowEmergencySheet
    ] = useState(false);


    const previousEmergencyId =
        useRef<number | null>(null);


    const activeResponseRef =
        useRef<HTMLDivElement | null>(null);


    const [
        responseRefreshKey,
        setResponseRefreshKey
    ] = useState(0);

    // CHECK ACTIVE RESPONSE

    async function checkActiveResponse() {

        if (!Number.isInteger(fleetId) || fleetId <= 0) {
            return;
        }


        try {

            const response = await fetch(`http://localhost:3001/api/fleet/${fleetId}/active-response`);


            if (!response.ok) {

                setActiveEmergency(null);
                return;
            }


            const data = await response.json();


            if (!data || !data.id_emergency) {

                setActiveEmergency(null);
                return;
            }

            setActiveEmergency(data);

            /*
             * Show popup when a new
             * accepted emergency appears.
             */
            if (previousEmergencyId.current !== data.id_emergency
            ) {

                previousEmergencyId.current = data.id_emergency;
                setShowEmergencySheet(true);
            }


        } catch (error) {

            console.error('Failed to check active response:', error);
        }
    }

    // RESPONSE CHANGED

    function handleResponseChanged() {

        /*
         * Changing the React key forces
         * ActiveResponse to remount.
         */
        setResponseRefreshKey( previous => previous + 1);

        /*
         * Refresh popup information too.
         */
        setTimeout(() => {
            checkActiveResponse();
        }, 150);
    }

    // POLL ACTIVE RESPONSE

    useEffect(() => {

        checkActiveResponse();

        const interval = setInterval(checkActiveResponse,3000);

        return () => {
            clearInterval(interval);
        };

    }, [fleetId]);

    // JUMP TO NAVIGATION

    function openNavigation() {

        setShowEmergencySheet(false);

        /*
         * Refresh ActiveResponse before
         * jumping to the navigation area.
         */
        setResponseRefreshKey( previous => previous + 1);

        setTimeout(() => {

            activeResponseRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

        }, 250);
    }

    return (

        <main className=" min-h-screen bg-slate-100
                py-10 px-4">

            <div className=" relative mx-auto w-full
            max-w-107.5 min-h-212.5
             bg-white rounded-[2.5rem] border-8
             border-slate-900 shadow-2xl overflow-hidden">

                {/* TOP BAR */}

                <div
                    className=" bg-slate-950 text-white
                        px-5 pt-3 pb-4">

                    <div className=" w-24 h-5
                            bg-black rounded-full mx-auto mb-4"/>

                    <div className=" flex
                            items-center justify-between">

                        <div>
                            <p className="text-xs text-slate-400">
                                Defergency
                            </p>

                            <h1 className="font-bold text-lg">
                                מכשיר מתנדב
                            </h1>

                        </div>

                        <div className=" text-xs bg-green-500/20
                         text-green-300 border border-green-500/30
                        px-3 py-1 rounded-full">
                            מחובר
                        </div>

                    </div>

                </div>

                {/* DEVICE IDENTITY */}

                <div className=" px-5 py-4 border-b
                 bg-slate-50">

                    <div className=" flex items-center justify-between">

                        <div>
                            <p className="text-sm text-slate-500">
                                מזהה מכשיר
                            </p>

                            <p className="font-bold text-slate-900">
                                Fleet #{fleetId}
                            </p>

                        </div>

                        <div className=" text-xs text-slate-500
                         bg-white border rounded-lg px-3
                         py-2">
                            משתמש רשום
                        </div>

                    </div>

                </div>


                {/* PHONE SCREEN */}

                <div
                    className="p-4 space-y-4 bg-slate-50
                    min-h-125 max-h-145 overflow-y-auto
                    lora-scrollbar scroll-smooth"
                >

                    {/* ACTIVE RESPONSE /
                        NAVIGATION */}

                    <div ref={activeResponseRef}>

                        <ActiveResponse
                        key={responseRefreshKey}
                        fleetId={fleetId}
                        />

                    </div>


                    {/*  INCOMING ALERTS */}

                    <section className=" bg-white
                    rounded-2xl border shadow-sm
                     p-4">

                        <IncomingAlerts
                            fleetId={fleetId}
                            onResponseChanged={handleResponseChanged}
                        />

                    </section>


                    {/* EMERGENCY CALLER */}

                    <section className=" bg-white rounded-2xl
                            border shadow-sm p-4">

                        <EmergencyCaller />

                    </section>

                </div>


                {/* BOTTOM PHONE BAR */}

                <div className=" bg-white py-3">

                    <div
                        className="  w-32 h-1.5
                            bg-slate-300 rounded-full
                            mx-auto
                        "
                    />

                </div>


                {/* NAVIGATION POPUP */}

                {
                    activeEmergency &&
                    showEmergencySheet &&
                    (

                        <div
                            className="absolute bottom-0 *:left-0
                                right-0 z-50
                                bg-white text-slate-900
                                border-t border-red-200
                                shadow-[0_-12px_35px_rgba(0,0,0,0.20)]
                                rounded-t-3xl p-5"
                            dir="rtl">

                            {/* POPUP HANDLE */}

                            <div
                                className=" w-12  h-1.5 rounded-full
                                    bg-slate-300mx-auto mb-4 "
                            />


                            <div
                                className="  flex items-start
                                    gap-3"
                            >

                                {/* ICON */}

                                <div
                                    className="w-12 h-12 shrink-0
                                        rounded-2xl bg-red-100
                                        text-red-600 flex
                                        items-center
                                        justify-center " >

                                    <Siren size={25} />

                                </div>

                                {/* EVENT INFO */}

                                <div
                                    className="  flex-1 "  >

                                    <p
                                        className="  text-xs  font-bold
                                            text-red-600  ">
                                        אירוע חירום התקבל
                                    </p>


                                    <h2  className=" text-lg font-bold
                                            text-slate-900  mt-1"  >
                                        אירוע #
                                        { activeEmergency.id_emergency}
                                    </h2>


                                    <p className="mt-2 text-sm text-slate-600"
                                    >
                                        מרחק:
                                        {' '}
                                        { Number( activeEmergency.distance_km
                                            ).toFixed(2)
                                        }

                                        {' '}
                                        ק״מ
                                    </p>


                                    <p  className=" mt-1 text-xs
                                            text-slate-500"
                                    >
                                        סטטוס:
                                        {' '}
                                        { activeEmergency.status}
                                    </p>

                                </div>


                                {/* CLOSE */}

                                <button type="button"

                                    onClick={() =>setShowEmergencySheet(
                                            false )
                                    }

                                    className="
                                        text-slate-400
                                        hover:text-slate-700
                                    "
                                >

                                    <ChevronDown
                                        size={22}
                                    />

                                </button>

                            </div>


                            {/* JUMP TO NAVIGATION */}

                            <button type="button"

                                onClick={ openNavigation}

                                className=" mt-5  w-full
                                    bg-red-600
                                    hover:bg-red-700
                                    text-white
                                    font-bold
                                    rounded-xl
                                    py-3
                                    transition "
                            >
                                מעבר לניווט
                            </button>

                        </div>
                    )
                }

            </div>

        </main>
    );
}