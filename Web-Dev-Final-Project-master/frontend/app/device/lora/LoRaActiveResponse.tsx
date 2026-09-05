'use client';

import { useState, useEffect, use } from 'react';
import MovementSimulator from '../MovementSimulator';
import dynamic from 'next/dynamic';

const LoRaOfflineMap = dynamic( () => import('./LoRaOfflineMap'), 
            {ssr: false});

type ActiveEmergency = {
    id_candidate: number;
    id_emergency: number;
    id_fleet: number;
    distance_km: number;
    responded_at: string;
    latitude: number;
    longitude: number;
    created_at: string;
    status: string;
};

type RouteData = { 
    distanceKm: number;
    durationMinutes: number;
    geometry: number[][];
};

type Props = {
    fleetId: number;
    refreshKey: number;
};

export default function LoRaActiveResponse ({fleetId, refreshKey} : Props ) {
    const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(null);
    const [route, setRoute] = useState<RouteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [startingNavigation, setStartingNavigation] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);
    const [breadcrumbPositions, setBreadcrumbPositions] = useState<[number, number][]>([]); 
    const [hasArrived, setHasArrived] = useState(false);
    
    async function loadActiveResponse() {
        try {
            const response = await fetch(`
                http://localhost:3001/api/fleet/${fleetId}/active-response`);

            if(!response.ok) {
                throw new Error('Failed to fetch active response for LoRa');
            }

            const data = await response.json();

            setActiveEmergency(data);

        } // try block
        catch(error) {

            console.error('Failed to load LoRa active response:',
                error
            );
        } // catch block

        finally {
            setLoading(false);
        }
    } // loadActiveResponse

    useEffect(() => {
        loadActiveResponse();
    }, [fleetId, refreshKey]);


    useEffect(() => {

        if(!activeEmergency || activeEmergency.status !== 'EN_ROUTE'){
            return;
        }

        async function checkArrival() {
            try {
                const response = await fetch(`
                    http://localhost:3001/api/emergencies/${activeEmergency?.id_emergency}/arrival-check?fleetId=${fleetId}`);
            if(!response.ok) {
                return;
            }
            
            const data = await response.json();

            setHasArrived(data.arrived);
            }

            catch(error){
                console.error('Failed to check LoRa Responder arrival', error);
            }
        } // hasArrived

        checkArrival();
        const interval = setInterval(checkArrival, 3000);
        return () => { clearInterval(interval) };

    }, [activeEmergency?.id_emergency,
        activeEmergency?.status,
        fleetId
    ]);

    async function startNavigation() {
        if(!activeEmergency) {
            return;
        }

        try {
            setStartingNavigation(true);

            const routeResponse = await fetch(
                `http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/route?fleetId=${fleetId}`
            );

            if(!routeResponse.ok) {
                throw new Error('Failed to calculate route');
            }

            const routeData = await routeResponse.json();

            const statusResponse = await fetch(`
                http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/start-navigation`,
                {
                    method: 'POST'
                });

                if(!statusResponse.ok) {
                    const errorData = await statusResponse.json();
                
                throw new Error(
                    errorData.error || 'Failed to start navigation'
                );
            }

            setRoute(routeData);

            setActiveEmergency({
                ...activeEmergency, status: 'EN_ROUTE'
            });

        } // try block
        catch(error) {
            console.error('Failed to start LoRa navigation:')

        } // catch block
        finally {
            setStartingNavigation(false);
        }
    } // startNavigation

    if(loading) {
        return (
            <div className="text-center text-sm">
                CHECKING RESPONSE...
            </div>
        );
    }

    if(!activeEmergency) {
        return null;
    }

    async function resolveEmergency() {
        if(!activeEmergency)
            return;

        try {
            const response = await fetch(`
                http://localhost:3001/api/emergencies/${activeEmergency.id_emergency}/resolve`,
            {
                method: 'POST',
                headers: {
                    'Content-type':'application/json'
                },
                body: JSON.stringify({id_fleet: fleetId})
            });

            if(!response.ok) {
                const errorData = await response.json();

                throw new Error(errorData.error || 'Failed to resolve emergency');
            }

            setActiveEmergency(null);
            setRoute(null);
            setCurrentPosition(null);
            setBreadcrumbPositions([]);
            setHasArrived(false);
        }
        catch(error) {
            console.error('Failed to resolve LoRa Emergency', error);
        }
    }

    return ( 
        <div className="mt-4 border-t border-gray-600 pt-4">
            <div className="font-bold text-green-800">
            Responding...
            </div>

            <div className="mt-2 text-sm">
                EMERGENCY #{activeEmergency.id_emergency}
            </div>

            <div className="text-sm">
                DIST: {Number(activeEmergency.distance_km).toFixed(2)} KM
            </div>

            <div className="text-sm">
                STATUS: {activeEmergency.status}
            </div>

            {!route && (
                <button
                onClick={startNavigation}
                disabled={startingNavigation}
                className="mt-3 px-3 py-2 bg-green-800 text-white rounded disabled:opacity-50">
                    {startingNavigation ? 'CALCULATING...' : 'START NAV'}
                </button>
            )}

            {route && ( 
                <div className="mt-4">
                    <div className="font-bold">
                        OFFLINE NAV
                    </div>
                    
                    <div className="mt-2 text-sm">
                        DIST LEFT: {route.distanceKm.toFixed(2)} KM
                    </div>

                    <div className="text-sm">
                        ETA: {route.durationMinutes.toFixed(1)} MIN
                    </div>
                    
                    <LoRaOfflineMap geometry={route.geometry}
                                    currentPosition={currentPosition}
                                    breadcrumbPositions={breadcrumbPositions} />

                    <MovementSimulator 
                        fleetId={fleetId}
                        geometry={route.geometry}
                        onPositionChange={(latitude, longitude) => {
                            const newPosition: [number, number] = [latitude, longitude];
                            setCurrentPosition(newPosition);
                            setBreadcrumbPositions((previous) => [...previous, newPosition]);
                        }}
                        />

                    {hasArrived ? (
                    <div className="mt-4">
                    <div className="font-bold text-green-800">
                    ✓ ARRIVAL DETECTED
                    </div>

                    <button
                        onClick={resolveEmergency}
                        className="mt-2 px-3 py-2 bg-green-900 text-white rounded">
                        COMPLETE EVENT
                    </button>
                    </div>)                   
                    : (
                    <div className="mt-3 text-xs">
                    TRACKING RESPONDER...
                    </div>
                    )}
                </div>
            )}

        </div>
    );
 }