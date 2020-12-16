import React from "react";
import { GoogleMap, Marker, withGoogleMap, withScriptjs } from "react-google-maps";
import { compose, withProps } from "recompose";
import { environment } from "../../environments/environment";

interface MyGoogleMapProps {
    latitude?: number;
    longitude?: number;
    onMapClick: (e: any) => void;
    onMarkerClick: (e: any) => void;
};

export const MyGoogleMap =
    compose<MyGoogleMapProps, any>(
        withProps({
            googleMapURL: `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&v=3.exp&libraries=geometry,drawing,places`,
            loadingElement: <div style={{ height: `100%` }} />,
            containerElement: <div style={{ height: `400px` }} />,
            mapElement: <div style={{ height: `100%` }} />
        }),
        withScriptjs,
        withGoogleMap
    )(props => (
        <GoogleMap
            defaultZoom={8}
            defaultCenter={{ lat: props.latitude, lng: props.longitude }}
            onClick={props.onMapClick}
        >
            <Marker
                position={{ lat: props.latitude, lng: props.longitude }}
                onClick={props.onMarkerClick}
            />
        </GoogleMap>
    ))
