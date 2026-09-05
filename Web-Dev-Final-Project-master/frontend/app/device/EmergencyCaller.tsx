'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(
    () => import('./LocationPickerMap'),
    {ssr:false}
);

export default function EmergencyCaller() {
    const [status, setStatus] = useState('');
    const [showMap, setShowMap] = useState(false);

    const [selectedLocation, setSelectedLocation] =
        useState<[number, number] | null>(null);
    
    const sendEmergency = async (
        latitude: number,
        longitude: number
    ) => {
        try {
            setStatus('Sending Emergency...');

            const response = await fetch(
                'http://localhost:3001/api/emergencies',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({latitude,
                         longitude}),
                }
            );

            if(!response.ok)
                throw new Error('Failed to create emergency');

            const data = await response.json();
            setStatus(
                `Emergency sent successfully. Emergency ID: ${data.id_emergency}`
            );

        } // try block

        catch (error) {
            console.error(error);
            setStatus('Failed to send emergency');
        } // catch block

    };

    const callForHelp = () => {
        if(!navigator.geolocation) {
            setStatus('GPS is unavailable. Please choose your location');
            setShowMap(true);
            return;
        }

        setStatus('Getting your location...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                sendEmergency(
                    position.coords.latitude,
                    position.coords.longitude
                );
            },
            (error) => {
                console.error(error);
                setStatus(
                    'Could not access your GPS. Please choose your approx. location.'
                );
                setShowMap(true);
            }
        );
    };

    return (
        <main dir="rtl" className="p-8 max-w-xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">
             נתקלת באירוע חירום?
            </h1>

            <button
                onClick={callForHelp}
                className="w-full bg-red-600 text-white p-4 rounded-lg font-bold"
                >
                    קרא לעזרה
            </button>

            <button
                onClick= {() => setShowMap(true)}
                className="w-full mt-3 border p-3 rounded-lg"
                >
                    בחר מיקום משוערך
                </button>

                {showMap &&
                    <div className="mt-6">

                        <LocationPickerMap
                            selectedLocation={selectedLocation}
                            onSelect={setSelectedLocation}
                        />

                        <button
                        disabled={!selectedLocation}
                        onClick={() => {
                            if(selectedLocation) {
                                sendEmergency(
                                    selectedLocation[0],
                                    selectedLocation[1]
                                );
                            }
                        }}
                        className="w-full mt-4 bg-red-600 text-white p-3 rounded-lg disabled:opacity-50"
                        >
                            Send Emergency From Selected Location
                        </button>
                    </div>
                }

                {status && (
                    <p className="mt-5">
                        {status}
                    </p>
                )}

        </main>
    );

}; // DevicePage block
