'use client';

import { useEffect, useState } from 'react';
import MovementSimulator from './MovementSimulator';
import dynamic from 'next/dynamic';
import { LargeNumberLike } from 'crypto';

const NavigationMap = dynamic(
    () => import('./NavigationMap'),
    { ssr: false }
);

// TYPES

const emergencyStatusLabels:
    Record<string, string> = {

    OPEN: 'אירוע פתוח',
    EN_ROUTE: 'מתנדב בדרכו לנקודה',
    RESOLVED: 'אירוע נסגר',
    RESPONDER_FOUND: 'נמצא מתנדב רלוונטי',
};

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

type NavigationInstruction = {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
    wayPoints: number[];
}

type RouteData = {
    distanceKm: number;
    durationMinutes: number;
    geometry: number[][];
    instructions: NavigationInstruction[];
};

type Props = {
    fleetId: number;
};

export default function ActiveResponse({ fleetId }: Props) {

    const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(null);

    const [loading, setLoading] = useState(true);

    const [route, setRoute] = useState<RouteData | null>(null);

    const [startingNavigation, setStartingNavigation] = useState(false);

    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

    const [breadcrumbPositions, setBreadcrumbPositions] = useState<[number, number][]>([]);

    const [hasArrived, setHasArrived] = useState(false);

    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);

    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

    async function loadActiveResponse() {
        try {
            const response = await fetch(
                `http://localhost:3001/api/fleet/${fleetId}/active-response`
            );

            if (!response.ok) {
                throw new Error(
                    'Failed to load active response'
                );
            }

            const data = await response.json();
            setActiveEmergency(data);

        } catch (error) { console.error('Failed to load active response:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadActiveResponse();
    }, [fleetId]);

    // arrival check 

    useEffect(() => {

        if (!activeEmergency || activeEmergency.status !== 'EN_ROUTE') {
            return;
        }

        async function checkArrival() {
            try {
                const response = await fetch(
                    `http://localhost:3001/api/emergencies/${activeEmergency?.id_emergency}/arrival-check?fleetId=${fleetId}`
                );

                if (!response.ok) {
                    return;
                }

                const data = await response.json();
                setHasArrived(data.arrived);

            } catch (error) {
                console.error('Failed to check responder arrival:', error);
            }
        }

        // check immediately
        checkArrival();

        // continue checking every 3 seconds
        const interval = setInterval(
            checkArrival,
            3000
        );

        return () => { clearInterval(interval);
        };

    }, [
        activeEmergency?.id_emergency,
        activeEmergency?.status,
        fleetId
    ]);

    async function startNavigation() {

        if (!activeEmergency) {
            return;
        }

        try {

            setStartingNavigation(true);

            // Get bicycle route
            const routeResponse = await fetch(
                `http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/route?fleetId=${fleetId}`
            );

            if (!routeResponse.ok) {
                throw new Error(
                    'Failed to fetch route'
                );
            }

            const routeData =
                await routeResponse.json();


            // Change emergency status:
            // RESPONDER_FOUND -> EN_ROUTE
            const statusResponse = await fetch(
                `http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/start-navigation`,
                {
                    method: 'POST'
                }
            );

            if (!statusResponse.ok) {

                const errorData = await statusResponse.json();

                throw new Error(
                    errorData.error ||
                    'Failed to start navigation'
                );
            }

            setRoute(routeData);

            setActiveEmergency({
                ...activeEmergency,
                status: 'EN_ROUTE'
            });

        } catch (error) {
            console.error(
                'Failed to start navigation:',
                error
            );

        } finally {
            setStartingNavigation(false);
        }
    }

    async function resolveEmergency() {

        if (!activeEmergency) {
            return;
        }

        try {

            const response = await fetch(
                `http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/resolve`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':'application/json'
                    },

                    body: JSON.stringify({
                        id_fleet: fleetId
                    })
                }
            );

            if (!response.ok) {

                const errorData = await response.json();

                throw new Error(
                    errorData.error ||
                    'Failed to resolve emergency'
                );
            }

            setActiveEmergency(null);
            setRoute(null);
            setCurrentPosition(null);
            setBreadcrumbPositions([]);
            setHasArrived(false);

        } catch (error) {
            console.error(
                'Failed to resolve emergency:',
                error
            );
        }
    }

     useEffect(() => {

        if (!route || !route.instructions?.length) {
        return;
    }
    // way points indicate how many "points" are covered by an instruction
    const instructionIndex = route.instructions.findIndex(
        instruction => {
            const [start, end] = instruction.wayPoints;

                return (currentRouteIndex >= start && currentRouteIndex <= end);
            }
        );
        if (instructionIndex !== -1) {
            setCurrentInstructionIndex(instructionIndex);
        }
    }, [currentRouteIndex, route]);

    if (loading) {
        return (
            <p className="mb-4">
                Checking active response...
            </p>
        );
    }

    if (!activeEmergency) {
        return null;
    }

    return (
        <section dir="rtl" className="w-full max-w-xl mb-8">

            <div
                className="border rounded-lg p-5 bg-green-50 shadow-sm">

                <h2 className="text-xl font-bold">
                    הכוונה לאירוע חירום #
                    {activeEmergency.id_emergency}
                </h2>


                <p className="mt-3">
                    <strong> מרחק: </strong>{' '}

                    {Number(activeEmergency.distance_km).toFixed(2)} ק"מ
                </p>


                <p>
                    <strong> סטטוס: </strong>{' '}
                    {emergencyStatusLabels[activeEmergency.status]}
                </p>


                <p>
                    <strong> אירוע נוצר:</strong>{' '}
                    {activeEmergency.created_at}
                </p>


                {/* START NAVIGATION */}

                {!route && (
                    <button
                        onClick={startNavigation}
                        disabled={startingNavigation}
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                        {startingNavigation
                            ? 'מחשב מסלול'
                            : 'התחל ניווט'}
                    </button>
                )}


                {/* NAVIGATION */}

                {route && (
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-2">
                            ניווט מותאם לשבילי אופניים
                        </h3>
                        <div className="mb-4">
                            <p>
                                <strong> מרחק:</strong>{' '}
                                {Number(route.distanceKm).toFixed(2)} ק"מ
                            </p>

                            <p>
                                <strong> זמן דיווש משוער: </strong>{' '}

                                {Number(route.durationMinutes).toFixed(1)} דקות
                            </p>
                        </div>

                        {route.instructions?.length > 0 && (
                            <div className=" mb-4 rounded-xl bg-slate-900
                             text-white p-4">
                                
                                <p className="text-xs text-slate-400">
                                     הוראת ניווט
                                     </p>
                                     <p className="font-bold text-lg mt-1">
                                        {route.instructions[ currentInstructionIndex]?.instruction}
                                         </p>
                                         
                                         <p className="text-sm mt-1 text-slate-300">
                                             בעוד{' '}
                                             {Math.round(route.instructions[currentInstructionIndex]?.distanceMeters ?? 0)}
                                             {' '} מטר
                                             </p>
                                             </div>
                                            )}


                        <NavigationMap geometry={route.geometry}
                                emergencyLatitude={activeEmergency.latitude}
                                emergencyLongitude={activeEmergency.longitude}
                                currentPosition={currentPosition}
                                breadcrumbPositions={breadcrumbPositions}
                        />

                        {/* MOVEMENT SIMULATOR */}

                        <MovementSimulator
                            fleetId={fleetId}
                            geometry={route.geometry}
                            onPositionChange={(
                                latitude,
                                longitude
                            ) => {const newPosition:[number, number] = [latitude,longitude];
                                setCurrentPosition(newPosition);
                                setBreadcrumbPositions((previous) => [...previous,newPosition]);
                            }}
                            onRouteIndexChange={setCurrentRouteIndex}
                        />


                        {/* ARRIVAL STATE */}

                        {hasArrived ? (

                            <div className="mt-5">
                                <p className="font-bold text-green-700">
                                    ✓ הגעת לנקודה - האם האירוע הסתיים?
                                </p>

                                <button
                                    onClick={resolveEmergency}
                                    className="mt-3px-4 py-2 bg-blue-700 text-white rounded-lg">
                                    סיום אירוע
                                </button>
                            </div>

                        ) : (

                            <p className="mt-4 text-sm text-gray-600">
                                Arrival will be detected
                                automatically when the
                                responder is within 50 meters
                                of the emergency.
                            </p>

                        )}

                    </div>
                )}

            </div>

        </section>
    );
}