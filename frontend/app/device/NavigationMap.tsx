
'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker, Circle } from "react-leaflet";
import L from 'leaflet';

type Props = {
    geometry: number[][];
    emergencyLatitude: number;
    emergencyLongitude: number;
    currentPosition: [number, number] | null;
    breadcrumbPositions: [number, number][];
}

// ICONS 

const emergencyIcon = L.divIcon({
    className:'',
    html:`
    <div 
    style= "
            width:22px;
            height:22px;
            background: #dc2626;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 6px rgba(0,0,0,0.5);
            "
    ></div>
    `, 
    iconSize: [22,22],
    iconAnchor: [11,11]
});

const responderIcon = L.divIcon({
    className:'',
    html:`
        <div
            style="
            width: 18px;
            height: 18px;
            background: #2563eb;
            border: 3px solid white;
            border-radius:50%;
            box-shadow: 0 5px rgba(0,0,0,0.5);
            "
            ></div>
    `,
    iconSize:[18,18],
    iconAnchor:[9,9]
});


const movingResponderIcon = L.divIcon({
    className:'',
    html: `
    <div
        style="
        width:20px;
        height:20px;
        background:#16a34a;
        border: 3px solid white;
        border-radius:50%;
        box-shadow: 0 0 6px rgba(0,0,0,0.6);
        "
    ></div>`,
    iconSize: [20,20],
    iconAnchor:[10,10]
});


export default function NavigationMap({
    geometry,
    emergencyLatitude,
    emergencyLongitude,
    currentPosition,
    breadcrumbPositions
} : Props) {

    // ORS / GeoJSON:
    // [longitude, latitude]
    //
    // Leaflet:
    // [latitude, longitude]

    console.log('Navigation Map geometry: ', geometry);
    const routePositions: [number, number][] = 
        geometry.map((point) => [
            Number(point[1]),
            Number(point[0])
        ]);
    
    if (routePositions.length === 0) {
        return null;
    }
    console.log('currentPosition in NavigationMap:', currentPosition);

    return (

        <MapContainer
        center={routePositions[0]}
        zoom={15}
        style={{
            height:'400px',
            width:'100%'
        }}
        >
            <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polyline
                positions={routePositions}
            />
            
            {breadcrumbPositions.map((position, index) => (
                <CircleMarker
                key={`breadcrumb-${index}`}
                center={position}
                radius={2}
                pathOptions={{
                    color:"#000000",
                    fillColor:"#ffffff"
                }}
            />
            ))}
            
            {currentPosition && (
                <Marker
                position={currentPosition}
                icon={movingResponderIcon}
                zIndexOffset={3000}
                >
                    <Popup>
                        Current responder location
                    </Popup>

                </Marker>
            )}



            <Marker
                position={routePositions[0]}
                icon={responderIcon}
            >
                <Popup>
                Responder starting location 
                </Popup> 
            </Marker>

            <Marker
                position={[emergencyLatitude,
                    emergencyLongitude
                ]}
                icon={emergencyIcon}
                >
                    <Popup>
                        Emergency Destination
                    </Popup>
            </Marker>
        </MapContainer>
    )
};