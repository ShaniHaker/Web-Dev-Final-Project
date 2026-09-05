'use client';

import L from 'leaflet';

import { useState, useEffect } from 'react';

import { MapContainer, TileLayer, Marker, Popup,
    CircleMarker, useMap, useMapEvents } from 'react-leaflet';


delete (L.Icon.Default.prototype as any).__getIconUrl;

// LABELS
const medicalTrainingLabels:
    Record<string, string> = {

    'First Aid': 'עזרה ראשונה',
    Medic: 'חובש/ת',
    Paramedic: 'פרמדיק/ית',
    Doctor: 'רופא/ה',
    NONE: 'ללא הכשרה',
    None: 'ללא הכשרה'
};

const emergencyStatusLabels:
    Record<string, string> = {

    OPEN: 'אירוע פתוח',
    EN_ROUTE: 'מתנדב בדרכו לנקודה',
    RESOLVED: 'אירוע נסגר',
    RESPONDER_FOUND: 'נמצא מתנדב רלוונטי',
};

// ICONS

const fleetIcon = L.icon({
    iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

    shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


const EmergencyIcon = L.divIcon({
    className: '',

    html: `
        <div style="
        width:24px;
        height:24px;
        background:red;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 6px rgba(0,0,0,0.6);"
        ></div>
    `,

    iconSize: [24, 24],
    iconAnchor: [12, 12]
});


const selectedEmergencyIcon = L.divIcon({
    className: '',

    html: `
        <div style="
        width:24px;
        height:24px;
        background:#dc2626;
        border:4px solid white;
        border-radius:50%;
        box-shadow:0 0 9px rgba(220,38,38,0.9);"
        ></div>
    `,

    iconSize: [30, 30],
    iconAnchor: [15, 15]
});


const mutedEmergencyIcon = L.divIcon({
    className: '',

    html: `
        <div style="
        width:20px;
        height:20px;
        background:#dc2626;
        opacity:0.5;
        border:2px solid white;
        border-radius:50%;
        box-shadow:0 0 9px rgba(220,38,38,0.9);"
        ></div>
    `,

    iconSize: [20, 20],
    iconAnchor: [10, 10]
});


const candidateIcon = L.divIcon({
    className: '',

    html: `
        <div style="
        width:22px;
        height:22px;
        background:#16a34a;
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 0 5px rgba(0,0,0,0.5);"
        ></div>
    `,

    iconSize: [22, 22],
    iconAnchor: [11, 11]
});

// HELPER FUNCTION --> for stationary defibrillators view

function StationaryDefibrillatorLayer({
    defibrillators
}: {
    defibrillators: StationaryDefibrillator[];
}) {

    const map = useMap();

    const [visibleDefibrillators, setVisibleDefibrillators] =
        useState<StationaryDefibrillator[]>([]);

    function updateVisibleDefibrillators() {
        const zoom = map.getZoom();
        /*
         * Avoid drawing thousands of points
         * while the user is viewing a large area.
         */
        if (zoom < 13) {
            setVisibleDefibrillators([]);
            return;
        }

        const bounds = map.getBounds();
        const visible = defibrillators.filter((defi) => {

                const latitude = Number(defi.latitude);

                const longitude = Number(defi.longitude);

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                    return false;
                }

                return bounds.contains([latitude, longitude]);
            });

        setVisibleDefibrillators(visible);
    }


    useMapEvents({

        moveend() {updateVisibleDefibrillators();},

        zoomend() {updateVisibleDefibrillators();}

    });


    // mount
    useEffect(() => {
        updateVisibleDefibrillators();
    }, [defibrillators]);


    return (
        <>
            {visibleDefibrillators.map(
                (defi) => (

                    <CircleMarker key={`stationary-${defi.id}`}

                        center={[Number(defi.latitude), Number(defi.longitude)]}
                        radius={5}

                        pathOptions={{ color: '#7c3aed',fillColor: '#8b5cf6', 
                            fillOpacity: 0.85,
                            weight: 2
                        }}>

                        <Popup>
                            <div className="min-w-52" dir="rtl">

                                <h3 className="font-bold text-base mb-2">
                                    {defi.location_name ||'דפיברילטור נייח'}
                                </h3>

                                {defi.location_description && (
                                    <p className="text-sm mb-2">
                                        <strong> מיקום: </strong>{' '}
                                        {defi.location_description}
                                    </p>
                                )}

                                {(defi.street || defi.city) && (

                                    <p className="text-sm">
                                        <strong> כתובת:</strong>{' '}
                                        {defi.street}

                                        {defi.street_num
                                         ? ` ${defi.street_num}`
                                        : ''
                                        }
                                        {defi.city
                                        ? `, ${defi.city}`
                                        : ''
                                        }
                                    </p>
                                )}

                                {defi.floor && (
                                    <p className="text-sm">
                                        <strong>
                                            קומה:
                                        </strong>{' '}
                                        {defi.floor}
                                    </p>
                                )}


                                {defi.location_hours && (
                                    <p className="text-sm mt-2 whitespace-pre-line">
                                        <strong>
                                            שעות פעילות:
                                        </strong>

                                        <br />
                                        {defi.location_hours}
                                    </p>
                                )}


                                {defi.contact_phone && (
                                    <p className="text-sm mt-2">
                                        <strong>
                                            טלפון:
                                        </strong>{' '}

                                        <span dir="ltr">
                                            {defi.contact_phone}
                                        </span>
                                    </p>
                                )}

                                <div
                                    className="border-t border-slate-200 mt-3
                                        pt-2 text-xs text-slate-500">
                                    נתונים באדיבות{' '}
                                    <strong>
                                        איפה דפי?
                                    </strong>
                                </div>

                            </div>
                        </Popup>
                    </CircleMarker>

                )
            )}
        </>
    );
}


// TYPES

type FleetLocation = {
    id_fleet: number;

    first_name: string;
    last_name: string;

    has_defi: number;
    has_lora: number;

    lora_battery?: number | null;
    med_training?: string;

    latitude: number | null;
    longitude: number | null;

    time_of_transmit: string | null;
};

type Emergency = {
    id_emergency: number;

    latitude: number;
    longitude: number;

    created_at: string;
    status: string;
};


type StationaryDefibrillator = {
    id: number;

    location_name: string;
    location_description: string | null;

    latitude: number;
    longitude: number;

    city: string | null;
    street: string | null;
    street_num: string | null;

    floor: string | null;
    location_hours: string | null;

    contact_phone: string | null;
};


type Props = {
    fleet: FleetLocation[];

    stationaryDefibrillators:
        StationaryDefibrillator[];

    emergencies: Emergency[];

    selectedEmergencyId: number | null;

    candidates: FleetLocation[];

    onEmergencySelect:
        (id: number) => void;

    onClearEmergencySelection:
        () => void;
};


// RESET EMERGENCY SELECTION WHEN MAP IS CLICKED

function MapClickReset({
    onReset
}: {
    onReset: () => void;
}) {

    useMapEvents({
        click() {
            onReset();
        }
    });

    return null;
}

// MAP

export default function FleetMap({fleet, stationaryDefibrillators,emergencies,selectedEmergencyId,candidates,
    onEmergencySelect, onClearEmergencySelection
}: Props) {

    // Registered fleet devices with known location

    const devicesWithLocation =
        fleet.filter(
            (item) =>
                item.latitude !== null &&
                item.longitude !== null
        );

    /*
        IDLE: show every registered fleet member

        Emergency selected: show only fleet members that are candidates
    */

    const candidateIds = new Set( candidates.map( (candidate) => Number(candidate.id_fleet)));

    const displayedFleet = selectedEmergencyId === null
    ? devicesWithLocation
    : devicesWithLocation.filter((member) =>candidateIds.has(Number(member.id_fleet)));

    // Stationary defibrillators

    const validStationaryDefibrillators = stationaryDefibrillators.filter((defi) =>Number.isFinite(Number(defi.latitude)) && Number.isFinite(Number(defi.longitude)));

    return (

        <div
            className="relative w-125 h-125">

            <MapContainer center={[32.0853, 34.7818]}  zoom={13}

                /*
                    Drawing vector layers on Canvas rather then
                    inserting thousands of icons.
                */
                preferCanvas={true}

                style={{height: '500px', width: '500px'}}>

                <MapClickReset onReset={
                        onClearEmergencySelection
                    }/>

                <TileLayer attribution={'&copy; OpenStreetMap contributors'}
                    url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                />

                {/*STATIONARY DEFIBRILLATORS */}

                <StationaryDefibrillatorLayer
                defibrillators={
                stationaryDefibrillators} />


                {/* REGISTERED FLEET */}

                {displayedFleet.map((item) => (

                        <Marker key={`fleet-${item.id_fleet}`}

                            position={[Number(item.latitude), Number(item.longitude)]}

                            icon={ selectedEmergencyId !==null ? candidateIcon : fleetIcon }>

                            <Popup>

                                <div dir="rtl" className="min-w-45 text-center">

                                    <h3 className="font-bold text-base mb-2">
                                        {item.first_name}{' '}
                                        {item.last_name}
                                    </h3>


                                    <div className="space-y-1 text-sm">

                                        <p>
                                            <strong>
                                                דפיברילטור?
                                            </strong>{' '}

                                            {
                                                item.has_defi
                                                    ? 'כן'
                                                    : 'לא'
                                            }
                                        </p>


                                        <p>
                                            <strong>
                                                LoRa:
                                            </strong>{' '}

                                            {
                                                item.has_lora
                                                    ? 'כן'
                                                    : 'לא'
                                            }
                                        </p>


                                        {
                                            item.lora_battery !== undefined && (
                                                <p>

                                                    <strong>
                                                        סוללה:
                                                    </strong>{' '}

                                                    {
                                                        item.lora_battery !==
                                                        null

                                                            ? `${item.lora_battery}%`

                                                            : 'לא ידוע'
                                                    }

                                                </p>

                                            )
                                        }


                                        {item.med_training && (

                                            <p>

                                                <strong>
                                                    הכשרה רפואית:
                                                </strong>{' '}

                                                {
                                                    medicalTrainingLabels[item.med_training]
                                                }

                                            </p>

                                        )}


                                        <p>

                                            <strong>
                                               שידור אחרון:
                                            </strong>{' '}

                                            {
                                                item.time_of_transmit
                                                    ? item.time_of_transmit
                                                    : 'לא ידוע'
                                            }

                                        </p>

                                    </div>

                                </div>

                            </Popup>

                        </Marker>

                    )
                )}


                {/* EMERGENCIES */}

                {emergencies.map(
                    (emergency) => {

                        const isSelected =
                            emergency.id_emergency === selectedEmergencyId;

                        const emergencyMarkerIcon =

                            selectedEmergencyId === null

                                ? EmergencyIcon

                                : isSelected

                                    ? selectedEmergencyIcon

                                    : mutedEmergencyIcon;


                        return (

                            <Marker
                                key={`emergency-${emergency.id_emergency}`}

                                position={[Number(emergency.latitude), Number(emergency.longitude)]}

                                /*
                                    Selected emergency stays
                                    above the other markers.
                                */

                                zIndexOffset={isSelected ? 1000
                                        : selectedEmergencyId !==
                                          null
                                            ? -100
                                            : 0
                                }
                                icon={emergencyMarkerIcon}

                                eventHandlers={{

                                    click: (event) => {L.DomEvent.stopPropagation(event.originalEvent);

                                        if (!isSelected) {
                                        onEmergencySelect(emergency.id_emergency);
                                        }
                                    }
                                }}>

                                {( selectedEmergencyId ===null ||
                                        isSelected) && (

                                        <Popup closeButton={true} autoClose={true} closeOnClick={false}>

                                            <div dir="rtl" className="text-center">
                                            <h3 className="font-bold text-base mb-2">
                                                    אירוע חירום #
                                                    {
                                                        emergency.id_emergency
                                                    }
                                            </h3>

                                                <p>
                                                    <strong>
                                                        סטטוס:
                                                    </strong>{' '}

                                                    {
                                                        emergencyStatusLabels[emergency.status]
                                                    }

                                                </p>

                                                <p>

                                                    <strong>
                                                        נוצר ב:
                                                    </strong>{' '}

                                                    {emergency.created_at
                                                    }
                                                </p>
                                            </div>
                                        </Popup>
                                    )
                                }

                            </Marker>

                        );
                    }
                )}

            </MapContainer>


            {/*  MAP LEGEND */}

            <div className="absolute bottom-4 right-4
            z-1000 bg-white/95 shadow-lg border
         border-slate-200 rounded-xl px-4
         py-3 text-xs"
                dir="rtl">
                <p
                    className="font-bold mb-2 text-slate-800">
                    מקרא
                </p>

                <div className="space-y-2">

                    <div className="flex items-center gap-2">

                        <span className="w-3 h-3 rounded-full bg-red-600"/>
                        <span>
                            אירוע חירום
                        </span>

                    </div>

                    <div
                        className="flex items-center gap-2">

                        <span
                            className="w-3 h-3 rounded-full bg-blue-600"/>

                        <span>
                            מתנדב / דפיברילטור נייד
                        </span>

                    </div>

                    <div
                        className="flex items-center gap-2">

                        <span className=" w-3 h-3 rounded-full
                         bg-violet-600"/>

                        <span>
                            דפיברילטור נייח
                        </span>

                    </div>

                    <div className="flex items-center gap-2">

                        <span className="w-3 h-3 rounded-full
                         bg-green-600"/>

                        <span>
                            מתנדב מועמד לאירוע
                        </span>

                    </div>

                </div>

            </div>

        </div>
    );

}