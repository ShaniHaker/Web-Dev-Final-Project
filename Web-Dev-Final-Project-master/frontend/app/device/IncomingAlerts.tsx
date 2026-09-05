'use client';

import { Siren } from 'lucide-react';
import { useEffect, useState } from 'react';

type EmergencyNotification = {
    id_candidate: number;
    id_emergency: number;
    id_fleet: number;
    distance_km: number;
    notification_status: string;
    response_status: string;
    notified_at: string;
    latitude: number;
    longitude: number;
    created_at: string;
    emergency_status: string;
}

const emergencyStatusLabels:
    Record<string, string> = {

    OPEN: 'אירוע פתוח',
    EN_ROUTE: 'מתנדב בדרכו לנקודה',
    RESOLVED: 'אירוע נסגר',
    RESPONDER_FOUND: 'נמצא מתנדב רלוונטי',
};

type Props = {
    fleetId: number;
    onResponseChanged?: () => void;
};

export default function IncomingAlerts({ fleetId, onResponseChanged }: Props ) {
    const [notifications, setNotifications] = 
    useState<EmergencyNotification[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadNotifications() {
        try {
            const response = await fetch(
                `http://localhost:3001/api/fleet/${fleetId}/notifications`
            );

            if(!response.ok) {
                throw new Error('Failed to load notifications');
            }

            const data = await response.json();

            setNotifications(
                Array.isArray(data) ? data : []
            );
        } // try block

        catch (error) {
            console.error('Failed to load notifications', error);
        } // catch block
        finally {
            setLoading(false);
        }
    }

    async function respondToEmergency(
        emergencyId: number,
        responseValue: 'ACCEPTED' | 'DECLINED' 
    ) 
    {
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
                    response: responseValue
                })
            })

            if(!response.ok) {
                const errorData = await response.json();
                console.error(
                    'Backend response:',
                    response.status,
                    errorData
                );
                throw new Error(errorData.error || 'Failed to respond to emergency');
            }

            onResponseChanged?.();
            await loadNotifications();
        }
        catch (error) {
            console.error('Failed to respond:', error);
        }
    }

    useEffect(() => {
        loadNotifications();
    }, [fleetId]);

    if(loading) {
        return <p>Checking for nearby emergencies...</p>;
    }

    return (
        <section dir="rtl" className="w-full max-w-xl mb-8">
            <h2 className="text-xl font-bold mb-4">
                התרעות פעילות
            </h2>
            {notifications.length === 0 ? (
                <div className="border rounded-lg p-4 bg-white">
                    No active emergency requests.
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notification) =>
                        <div
                        key={notification.id_candidate}
                        className="border rounded-lg p-5 bg-white shadow-sm"
                        >
                        <h3 className="flex gap-2 font-bold text-lg">
                            <Siren  size={30} color="#dc2626"/>  אירוע חירום #{notification.id_emergency}
                        </h3>

                        <p className="mt-2">
                            <strong> מרחק: </strong> {' '}
                          {Number(notification.distance_km).toFixed(2)}  ק"מ 
                        </p>

                        <p>
                            <strong> סטטוס: </strong>{' '}
                            {emergencyStatusLabels[notification.emergency_status]}
                        </p>

                        <p>
                            <strong> התקבל ב: </strong>{' '}
                            {notification.notified_at}
                        </p>

                        <div className="flex gap- justify-between mt-4">
                            <button
                                onClick={() => 
                                    respondToEmergency(
                                        notification.id_emergency,
                                        'ACCEPTED'
                                    )
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-lg"
                                >
                                    אשר
                                </button>
                            <button
                                onClick={() =>
                                    respondToEmergency(
                                        notification.id_emergency,
                                        'DECLINED'
                                    )
                                }
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg"
                                >
                                    דחה
                                </button>
                        </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}