'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

type Props = {
    geometry: number[][];
    currentPosition: [number, number] | null;
    breadcrumbPositions: [number, number][];
};

export default function LoRaOfflineMap({ geometry, currentPosition, breadcrumbPositions } : Props ) {

    if(!geometry || geometry.length < 2) {
        return (
            <div className="text-xs text-center">
                    NO OFFLINE MAP DATA
            </div>
        )
    }

    const routePositions: [number, number][] = 
        geometry.map(point => [
            Number(point[1]),
            Number(point[0])
        ]);

    const start = routePositions[0];
    const destination = routePositions[routePositions.length - 1];

    function FitRouteBounds({
        positions
    }: { positions: [number,number][] })
    {
        const map = useMap();
        useEffect(() => { 
            if(positions.length > 0) {
                map.fitBounds(positions, { padding: [20,20]

                });
            }
        }, []);

        return null;

    } // FitRouteBounds

return (
    <div className="mt-3">
        <div className="text-xs font-bold mb-2">
           offline map
        </div>

        <MapContainer
            center={start}
            zoom={15}
            dragging={true}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            style={{
                height:'250px',
                width:'100%'
            }}>

                <FitRouteBounds positions={routePositions} />

                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Polyline
                    positions={routePositions} />

                <CircleMarker
                    center={start}
                    radius={6}
                    pathOptions={{
                        color:'black',
                        fillColor:'#3388ff',
                        fillOpacity:1,
                        stroke: true,
                        dashOffset:'8, 8',
                        weight:2
                    }}>

                    <Popup>
                        נקודת התחלה
                    </Popup>

                </CircleMarker>

                {breadcrumbPositions.map((position, index) => (
                    <CircleMarker
                        key={`lora-breadcrumb-${index}`}
                        center={position}
                        radius={3}
                        pathOptions={{
                            color:'black',
                            fillColor: 'black',
                            fillOpacity:1,
                            weight:1
                        }}>

                    </CircleMarker>
                ))

                }

                { currentPosition && (
                    <CircleMarker 
                        center={currentPosition}
                        radius={7}
                        pathOptions={{
                            color:'white',
                            fillColor:'#16a34a',
                            fillOpacity:1,
                            weight:3
                        }} >
                    </CircleMarker>     
                )} 
                
                <CircleMarker 
                    center={destination}
                    radius={7}
                    pathOptions={{
                        color:'black',
                        fillColor:'#dc2626',
                        fillOpacity:1,
                        stroke:true,
                        weight:2
                    }}>
                        <Popup>
                            אירוע חירום
                        </Popup>
                </CircleMarker>
            </MapContainer>
    </div>
)

} // LoRaOfflineMap