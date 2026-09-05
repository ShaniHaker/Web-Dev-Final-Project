'use client';

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents
} from 'react-leaflet';

import L from 'leaflet';

type Props = {
    selectedLocation: [number, number] | null;

    onSelect: (
        location: [number, number] 
    ) => void;
};

const selectedIcon = L.divIcon({
    className: '',
    html:`
        <div
        style="
            width: 22px;
            height: 22px;
            background: red;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 5px rgba(0,0,0,0.6);
            "
            ></div>
    `,
    iconSize: [22,22],
    iconAnchor:[11,11],
});

function MapClickHandler({
    onSelect
}:  {
    onSelect: (
        location: [number, number]
    ) => void;
}) {
    useMapEvents({
        click(event) {
            onSelect([
                event.latlng.lat,
                event.latlng.lng
            ]);
        },
    });

    return null;
}

export default function LocationPickerMap({
    selectedLocation,
    onSelect
}: Props) {
    return (
        <MapContainer
        center = {[32.0853, 34.7818]}
        zoom = {13}
        style = {{
            height: '350px',
            width: '100%'
        }}
        >
        <TileLayer 
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler 
            onSelect={onSelect}
        />

        {selectedLocation && (
            <Marker 
            position={selectedLocation}
            icon={selectedIcon}>

            <Popup>
                Approx. emergency location
            </Popup>
            </Marker>
        )}
        </MapContainer>
    );
}

 
