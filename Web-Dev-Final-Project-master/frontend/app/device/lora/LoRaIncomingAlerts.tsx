'use client';

import { Albert_Sans } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';

type EmergencyNotification = {
    id_candidate: number;
    id_emergency: number;
    distance_km: number;
    notified_at: string;
};

type Props = {
    fleetId: number;
    onAlertSignal?: () => void;
    onResponseChanged?: () => void;
};

export default function LoRaIncomingAlerts( {fleetId, onAlertSignal, onResponseChanged } : Props) {
    const[notifications, setNotifications] = 
    useState<EmergencyNotification[]>([]);

    const knownAlertIds = useRef<Set<number>>(new Set());

    const firstLoad = useRef(true);

    async function loadNotifications() {
        try {
            const response = await fetch(
                `http://localhost:3001/api/fleet/${fleetId}/notifications`);
            
            if(!response.ok) {
                throw new Error('Failed to load LoRa notifications');
            }

            const data = await response.json();
            const alerts = Array.isArray(data) ? data : [];

            // component on startup => signal once 

            if(firstLoad.current) {
                if(alerts.length > 0) {
                    onAlertSignal?.()
                }

                alerts.forEach((alert) => {
                    knownAlertIds.current.add(alert.id_emergency)});

                firstLoad.current = false;
            
            } // first load

            else {
                // page already open => only signal new alerts

                const newAlerts = alerts.filter(
                    (alert) => 
                        !knownAlertIds.current.has(
                            alert.id_emergency
                        )
                );

                if(newAlerts.length > 0) {
                    onAlertSignal?.();
                }

                alerts.forEach((alert) => {
                    knownAlertIds.current.add(
                        alert.id_emergency
                    );
                });
            }

            setNotifications(alerts);
        } // try block

        catch (error) {
            console.error();
        }
    } // loadNotification func

    useEffect(() => {
         loadNotifications();   

        // polling interval for new alerts - 5sec
        const interval = setInterval(() => {
            loadNotifications(); 
        }, 5000);

        return () => { clearInterval(interval) }; 

    }, [fleetId]);
    
    async function respond(
        emergencyId: number, value: 'ACCEPTED' | 'DECLINED'
    ) {
        try {
            const response = await fetch(
                `http://localhost:3001/api/emergencies/${emergencyId}/respond`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_fleet: fleetId,
                    response: value
                })
            });

            if(!response.ok) {
                const errorData = await response.json();
                console.error(
                    'Respond Failed:',
                    response.status,
                    errorData
                );
                throw new Error( errorData.error || 'Failed to respond');
            }

            onResponseChanged?.();

        } // try block
        catch (error) {
            console.error(error);
        } // catch block

    } // respond func

    if(notifications.length === 0) {
        return (
            <div className="text-center text-sm">
                NO ACTIVE ALERTS
            </div>
        );
    }

    return (
        <div className="space-y-3">
        {notifications.map((alert) => (
            <div 
            key={alert.id_candidate}
            className="border-2 border-black rounded-xl p-4">

            <div dir ="rtl" className="font-bold text-red-700 text-center">
                ⚠ אירוע חירום  #{alert.id_emergency} 
            </div>

            <div dir="rtl" className="mt-2 text-sm text-center">
            מרחק: {Number(alert.distance_km).toFixed(2)} ק"מ
            </div>
            <div className="flex gap-2 mt-3">
                
                <button
                    onClick={() =>
                        respond(alert.id_emergency, 'DECLINED')
                    }
                    className="px-3 py-1 bg-red-700 text-white rounded ml-1"
                    >
                        דחה
                </button> 

                <button
                
                    onClick={() =>
                        
                        respond(alert.id_emergency, 'ACCEPTED')
                    }
                    className="px-3 py-1 bg-green-700 text-white rounded ml-28">
                     אשר
                    </button>


            </div>
            </div>   
        ))}
        </div>
    );
}