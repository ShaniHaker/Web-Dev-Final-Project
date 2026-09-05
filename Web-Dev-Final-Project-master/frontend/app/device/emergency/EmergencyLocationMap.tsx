'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

import L from 'leaflet';

import { useEffect } from 'react';

type Location = {
    latitude: number;
    longitude: number;
};

type Props = {
    location: Location | null;

    onLocationChange: (location: Location) => void;
};


const markerIcon =
    L.icon({
        iconUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

        shadowUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',

        iconSize:
            [25, 41],

        iconAnchor:
            [12, 41],

        popupAnchor:
            [1, -34],

        shadowSize:
            [41, 41]
    });


export default function EmergencyLocationMap({
    location,
    onLocationChange
}: Props) {

    return (

        <MapContainer
            center={[
                location?.latitude ??
                    32.0853,

                location?.longitude ??
                    34.7818
            ]}
            zoom={15}
            style={{
                height: '300px',
                width: '100%'
            }}
        >

            <TileLayer
                attribution=
                    '&copy; OpenStreetMap contributors'

                url=
                    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />


            <MapInteraction
                location={
                    location
                }

                onLocationChange={
                    onLocationChange
                }
            />


            {location && (

                <Marker
                    position={[
                        location.latitude,
                        location.longitude
                    ]}
                    icon={
                        markerIcon
                    }
                />
            )}

        </MapContainer>
    );
}


function MapInteraction({
    location,
    onLocationChange
}: Props) {

    const map =
        useMap();


    /*
     * When GPS gives us a new position,
     * move the map to it.
     */
    useEffect(() => {

        if (!location) {
            return;
        }


        map.flyTo(
            [
                location.latitude,
                location.longitude
            ],
            16
        );

    }, [
        location,
        map
    ]);


    useMapEvents({

        click(event) {

            onLocationChange({
                latitude:
                    event.latlng.lat,

                longitude:
                    event.latlng.lng
            });
        }

    });


    return null;
}