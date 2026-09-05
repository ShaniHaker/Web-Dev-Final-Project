'use client';

type Props = {
    fleetId: number;
    geometry: number[][];
    onPositionChange?: (
        latitude: number,
        longitude: number
    ) => void;
    onRouteIndexChange?:(index: number) => void;
};

export default function MovementSimulator({
    fleetId,
    geometry,
    onPositionChange,
    onRouteIndexChange
}: Props) {
    async function sendLocation(
        latitude: number, 
        longitude: number 
    ) {
        const response = await fetch(
            `http://localhost:3001/api/fleet/${fleetId}/location`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    latitude,
                    longitude
                })
            }
        );

        if(!response.ok) {
            throw new Error('Failed to update responder location');
        }
    } // sendLocation

    async function startSimulation() {
        try {
            for(let index = 0; index < geometry.length; index++) {
                // ORS [longitude, latitude]

                const point = geometry[index];

                const longitude = Number(point[0]);
                const latitude = Number(point[1]);

                await sendLocation(
                    latitude,
                    longitude
                );

                onPositionChange?.(
                    latitude,
                    longitude
                );
                onRouteIndexChange?.(index);

                // simulation delay
                await new Promise(
                    resolve => setTimeout(resolve, 1500)
                );
            }
        } // try block
        catch(error) {
            console.error(
                'Movement simulation failed:', error
            );

        }
    } // startSimulation
    
    return (
        <button
        onClick={startSimulation}
        className="mt-4 px-4 py-2 bg-blue-600 text-white
        rounded-lg">
            Simulate Responder Movement
        </button>
    )
}

